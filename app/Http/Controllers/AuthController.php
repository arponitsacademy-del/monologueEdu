<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\WordPressHasher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class AuthController extends Controller
{
    public function showLoginForm(): View
    {
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }

        return view('auth.login');
    }

    public function login(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'max:20'],
            'password' => ['required', 'string'],
        ]);

        $normalizedPhone = User::normalizePhone($validated['phone']);
        $user = $normalizedPhone ? User::where('phone', $normalizedPhone)->first() : null;

        if (! $user && filter_var($validated['phone'], FILTER_VALIDATE_EMAIL)) {
            $user = User::where('email', strtolower(trim($validated['phone'])))->first();
        }

        if (! $user) {
            return back()->withErrors([
                'phone' => 'Invalid phone number or password.',
            ])->onlyInput('phone');
        }

        $passwordMatches = false;
        if (str_starts_with($user->password, '$wp$') || str_starts_with($user->password, '$P$') || str_starts_with($user->password, '$H$')) {
            $wpHasher = new WordPressHasher();
            if ($wpHasher->checkPassword($validated['password'], $user->password)) {
                $passwordMatches = true;
                $user->password = Hash::make($validated['password']);
                $user->save();
            }
        } else {
            $passwordMatches = Hash::check($validated['password'], $user->password);
        }

        if (! $passwordMatches) {
            return back()->withErrors([
                'phone' => 'Invalid phone number or password.',
            ])->onlyInput('phone');
        }

        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }

    public function showRegisterForm(): View
    {
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }

        return view('auth.register');
    }

    public function register(Request $request): RedirectResponse
    {
        $normalizedPhone = User::normalizePhone($request->input('phone'));

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => [
                'required',
                'string',
                'max:20',
                Rule::unique('users', 'phone')->where(fn ($query) => $query->where('phone', $normalizedPhone)),
            ],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if ($normalizedPhone === null || ! User::isValidPhoneNumber($normalizedPhone)) {
            return back()->withErrors([
                'phone' => 'Please provide a valid Bangladeshi mobile number.',
            ])->onlyInput('name', 'phone', 'email');
        }

        if (User::where('phone', $normalizedPhone)->exists()) {
            return back()->withErrors([
                'phone' => 'This phone number is already registered.',
            ])->onlyInput('name', 'phone', 'email');
        }

        $user = User::create([
            'name' => $validated['name'],
            'phone' => $normalizedPhone,
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_ACTIVE,
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('dashboard');
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    }

    public function dashboard(): View
    {
        $user = Auth::user();

        return view('dashboard', ['user' => $user]);
    }
}
