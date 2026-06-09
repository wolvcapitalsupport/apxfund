export type Lang = 'en' | 'de'

export const translations = {
  en: {
    nav: { home: 'Home', plans: 'Investment Plans', about: 'About Us', team: 'Our Team', policies: 'Policies', login: 'Login', getStarted: 'Get Started' },
    auth: { loginTitle: 'Welcome back', loginSub: 'Sign in to your APXFund account', registerTitle: 'Create your account', registerSub: 'Join APXFund and start investing today', email: 'Email address', password: 'Password', fullName: 'Full name', phone: 'Phone number', country: 'Country', login: 'Sign in', register: 'Create account', noAccount: "Don't have an account?", hasAccount: 'Already have an account?', forgotPassword: 'Forgot password?' },
  },
  de: {
    nav: { home: 'Startseite', plans: 'Investitionspläne', about: 'Über uns', team: 'Unser Team', policies: 'Richtlinien', login: 'Anmelden', getStarted: 'Jetzt starten' },
    auth: { loginTitle: 'Willkommen zurück', loginSub: 'Melden Sie sich bei Ihrem APXFund-Konto an', registerTitle: 'Konto erstellen', registerSub: 'Treten Sie APXFund bei und beginnen Sie noch heute zu investieren', email: 'E-Mail-Adresse', password: 'Passwort', fullName: 'Vollständiger Name', phone: 'Telefonnummer', country: 'Land', login: 'Anmelden', register: 'Konto erstellen', noAccount: 'Noch kein Konto?', hasAccount: 'Bereits ein Konto?', forgotPassword: 'Passwort vergessen?' },
  },
}

export function t(lang: Lang, path: string): string {
  const keys = path.split('.')
  let result: any = translations[lang]
  for (const key of keys) result = result?.[key]
  return result ?? path
}
