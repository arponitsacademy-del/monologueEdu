<?php

namespace App\Services;

class WordPressHasher
{
    private string $itoa64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

    /**
     * Check if a plaintext password matches WordPress hashes ($wp$2y$..., $P$..., $H$..., or MD5).
     */
    public function checkPassword(string $password, string $storedHash): bool
    {
        // 1. Modern WordPress 6.8+ Bcrypt with HMAC-SHA384
        if (str_starts_with($storedHash, '$wp$')) {
            $bcryptHash = substr($storedHash, 3); // removes '$wp', leaving '$2y$...'
            $preHashed = base64_encode(hash_hmac('sha384', trim($password), 'wp-sha384', true));
            return password_verify($preHashed, $bcryptHash);
        }

        // 2. Standard PHP / Laravel Bcrypt
        if (str_starts_with($storedHash, '$2y$') || str_starts_with($storedHash, '$2a$')) {
            return password_verify($password, $storedHash);
        }

        // 3. Legacy MD5 fallback (uncommon, but supported)
        if (strlen($storedHash) === 32) {
            return hash_equals($storedHash, md5($password));
        }

        // 4. Legacy WordPress phpass hash ($P$ or $H$)
        if (str_starts_with($storedHash, '$P$') || str_starts_with($storedHash, '$H$')) {
            $countLog2 = strpos($this->itoa64, $storedHash[3]);
            if ($countLog2 === false || $countLog2 < 7 || $countLog2 > 30) {
                return false;
            }

            $count = 1 << $countLog2;
            $salt = substr($storedHash, 4, 8);
            if (strlen($salt) !== 8) {
                return false;
            }

            $hash = md5($salt . $password, true);
            do {
                $hash = md5($hash . $password, true);
            } while (--$count);

            $output = substr($storedHash, 0, 12);
            $output .= $this->encode64($hash, 16);

            return hash_equals($storedHash, $output);
        }

        return false;
    }

    private function encode64(string $input, int $count): string
    {
        $output = '';
        $i = 0;
        do {
            $value = ord($input[$i++]);
            $output .= $this->itoa64[$value & 0x3f];
            if ($i < $count) {
                $value |= ord($input[$i]) << 8;
            }
            $output .= $this->itoa64[($value >> 6) & 0x3f];
            if ($i++ >= $count) {
                break;
            }
            if ($i < $count) {
                $value |= ord($input[$i]) << 16;
            }
            $output .= $this->itoa64[($value >> 12) & 0x3f];
            if ($i++ >= $count) {
                break;
            }
            $output .= $this->itoa64[($value >> 18) & 0x3f];
        } while ($i < $count);

        return $output;
    }
}
