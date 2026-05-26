'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { APP_CONFIG } from '@/config/app'

// Zod Schema for secure validation and sanitization
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email wajib diisi')
    .email('Format email tidak valid')
    .max(100, 'Email terlalu panjang')
    .transform((val) => val.trim().toLowerCase()),
  password: z
    .string()
    .min(1, 'Kata sandi wajib diisi')
    .min(6, 'Kata sandi minimal 6 karakter')
    .max(100, 'Kata sandi terlalu panjang')
    .refine((val) => !/[<>]/.test(val), {
      message: 'Karakter < atau > tidak diperbolehkan',
    }),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: LoginFormValues) {
    setLoading(true)
    setServerError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        // Safe generic error message to prevent account harvesting
        setServerError('Email atau kata sandi tidak cocok.')
        setLoading(false)
        return
      }

      router.push('/kasir')
      router.refresh()
    } catch {
      setServerError('Terjadi kesalahan sistem. Silakan coba lagi.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas-fog flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-sky-tint rounded-largecard mb-3 shadow-sm">
            <span className="text-2xl text-chartwell-blue font-bold">☕</span>
          </div>
          <h1 className="text-heading font-roobert font-medium text-slate-text tracking-heading">
            {APP_CONFIG.name}
          </h1>
          <p className="text-ash-gray text-caption mt-1">
            {APP_CONFIG.tagline}
          </p>
        </div>

        {/* Crisp Dashboard Card */}
        <div className="bg-cloud-white rounded-cards shadow-md border border-stone-border p-6">
          <h2 className="text-heading-sm font-medium text-slate-text mb-6">
            Masuk ke Akun
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-caption font-medium text-ash-gray mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="kasir@kafekamu.com"
                required
                autoComplete="email"
                {...register('email')}
                className={`w-full px-3 py-2 bg-cloud-white text-slate-text border rounded-inputs text-sm placeholder-ash-gray/60
                  focus:outline-none focus:border-chartwell-blue transition-all ${
                    errors.email ? 'border-red-500' : 'border-platinum-outline'
                  }`}
              />
              {errors.email && (
                <p className="text-red-500 text-caption mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-caption font-medium text-ash-gray mb-1.5"
              >
                Kata Sandi
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                {...register('password')}
                className={`w-full px-3 py-2 bg-cloud-white text-slate-text border rounded-inputs text-sm placeholder-ash-gray/60
                  focus:outline-none focus:border-chartwell-blue transition-all ${
                    errors.password ? 'border-red-500' : 'border-platinum-outline'
                  }`}
              />
              {errors.password && (
                <p className="text-red-500 text-caption mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {serverError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-caption px-3 py-2 rounded-inputs">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-chartwell-blue hover:opacity-95 active:scale-[0.98] disabled:opacity-60
                text-cloud-white font-medium py-2 px-4 rounded-buttons transition-all duration-150
                min-h-[38px] text-sm shadow-sm cursor-pointer"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        </div>

        <p className="text-center text-caption text-steel-gray mt-6">
          {APP_CONFIG.name} · v{APP_CONFIG.version}
        </p>
      </div>
    </div>
  )
}

