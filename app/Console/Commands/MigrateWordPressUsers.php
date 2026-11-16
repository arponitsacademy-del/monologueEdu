<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use PDO;

class MigrateWordPressUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'migrate:wordpress-users 
                            {--file= : Path to exported JSON or SQL file with WordPress users}
                            {--host= : WordPress MySQL Host (e.g. 127.0.0.1 or srv1620.hstgr.io)}
                            {--port=3306 : WordPress MySQL Port}
                            {--database= : WordPress Database name}
                            {--username= : WordPress Database username}
                            {--password= : WordPress Database password}
                            {--prefix=wp_ : WordPress table prefix (default: wp_)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate users and login credentials from WordPress (with Digits plugin support) into Laravel';

    public function handle(): int
    {
        $this->info('Starting WordPress user migration...');

        $filePath = $this->option('file');
        $dbName = $this->option('database');

        if ($filePath) {
            return $this->migrateFromFile($filePath);
        }

        if ($dbName) {
            return $this->migrateFromDatabase();
        }

        $this->warn('No migration source provided!');
        $this->line('You can either:');
        $this->line('1. Connect directly to WordPress database:');
        $this->info('   php artisan migrate:wordpress-users --host=127.0.0.1 --database=wp_db --username=root --password=secret');
        $this->line('2. Or provide an exported JSON file:');
        $this->info('   php artisan migrate:wordpress-users --file=users.json');

        return Command::INVALID;
    }

    protected function migrateFromDatabase(): int
    {
        $host = $this->option('host') ?: '127.0.0.1';
        $port = $this->option('port') ?: 3306;
        $dbName = $this->option('database');
        $user = $this->option('username');
        $pass = $this->option('password') ?: '';
        $prefix = $this->option('prefix') ?: 'wp_';

        $this->info("Connecting to WordPress database [{$dbName}] on [{$host}:{$port}]...");

        try {
            $dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset=utf8mb4";
            $pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
        } catch (\Throwable $e) {
            $this->error('Database connection failed: ' . $e->getMessage());
            return Command::FAILURE;
        }

        $this->info('Fetching users and Digits metadata from WordPress...');

        $sql = "
            SELECT 
                u.ID,
                u.user_login,
                u.user_email,
                u.user_pass,
                u.display_name,
                u.user_registered,
                m_phone.meta_value AS digits_phone,
                m_country.meta_value AS digits_countrycode,
                m_billing.meta_value AS billing_phone
            FROM `{$prefix}users` u
            LEFT JOIN `{$prefix}usermeta` m_phone ON u.ID = m_phone.user_id AND m_phone.meta_key = 'digits_phone_no'
            LEFT JOIN `{$prefix}usermeta` m_country ON u.ID = m_country.user_id AND m_country.meta_key = 'digt_countrycode'
            LEFT JOIN `{$prefix}usermeta` m_billing ON u.ID = m_billing.user_id AND m_billing.meta_key = 'billing_phone'
            ORDER BY u.ID ASC
        ";

        try {
            $stmt = $pdo->query($sql);
            $rows = $stmt->fetchAll();
        } catch (\Throwable $e) {
            $this->error('Failed to query WordPress users: ' . $e->getMessage());
            return Command::FAILURE;
        }

        $this->info('Found ' . count($rows) . ' users. Processing...');

        return $this->processUsers($rows);
    }

    protected function migrateFromFile(string $filePath): int
    {
        if (! file_exists($filePath)) {
            $this->error("File not found: {$filePath}");
            return Command::FAILURE;
        }

        $this->info("Reading data from {$filePath}...");
        $raw = file_get_contents($filePath);
        $data = json_decode($raw, true);

        if (! is_array($data)) {
            $this->error('Invalid JSON file format.');
            return Command::FAILURE;
        }

        return $this->processUsers($data);
    }

    /**
     * @param array<int, array<string, mixed>> $users
     */
    protected function processUsers(array $users): int
    {
        $imported = 0;
        $skipped = 0;
        $invalid = 0;

        $bar = $this->output->createProgressBar(count($users));
        $bar->start();

        foreach ($users as $row) {
            $rawPhone = $row['digits_phone'] 
                ?? $row['phone'] 
                ?? $row['billing_phone'] 
                ?? $row['user_login'] 
                ?? null;

            $normalizedPhone = User::normalizePhone($rawPhone);

            // If user_login was something else, check if user_login itself is a valid phone
            if (! $normalizedPhone && ! empty($row['user_login'])) {
                $normalizedPhone = User::normalizePhone($row['user_login']);
            }

            if (! $normalizedPhone) {
                $invalid++;
                $bar->advance();
                continue;
            }

            // Check if phone or email already exists in Laravel
            $email = ! empty($row['user_email']) ? trim($row['user_email']) : null;

            $exists = DB::table('users')
                ->where('phone', $normalizedPhone)
                ->orWhere(function ($q) use ($email) {
                    if ($email) {
                        $q->where('email', $email);
                    }
                })
                ->exists();

            if ($exists) {
                $skipped++;
                $bar->advance();
                continue;
            }

            $name = ! empty($row['display_name']) ? trim($row['display_name']) : 'Student';
            $passwordHash = $row['user_pass'] ?? $row['password'] ?? '';
            $createdAt = ! empty($row['user_registered']) ? $row['user_registered'] : now();

            // Insert directly via DB facade to avoid double-hashing password cast
            DB::table('users')->insert([
                'name' => $name,
                'phone' => $normalizedPhone,
                'registration_number' => User::generateUniqueRegistrationNumber(),
                'email' => $email ?: ($normalizedPhone . '@temporary.monologueedu.com'),
                'password' => $passwordHash,
                'role' => User::ROLE_STUDENT,
                'status' => User::STATUS_ACTIVE,
                'created_at' => $createdAt,
                'updated_at' => now(),
            ]);

            $imported++;
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $this->info("Migration completed!");
        $this->line("Successfully imported: <info>{$imported}</info>");
        $this->line("Skipped (already exists): <comment>{$skipped}</comment>");
        $this->line("Invalid (no valid phone number): <error>{$invalid}</error>");

        return Command::SUCCESS;
    }
}
