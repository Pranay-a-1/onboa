import { useAuth0 } from '@auth0/auth0-react'
import { Box, Button, Typography, Grid, Chip } from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'

/**
 * LandingPage — The public-facing entry point for unauthenticated visitors.
 *
 * Shown when:
 *   - The user is not logged in (App.jsx, route '/')
 *
 * Layout sections:
 *   1. Hero      — Brand wordmark, tagline, primary CTA
 *   2. Features  — 3 value-prop cards (security, speed, trust)
 *   3. Footer    — Minimal legal line
 *
 * Uses no external image assets — all visuals are CSS gradient + MUI icons.
 * This keeps the page functional even before any media assets are uploaded.
 */
function LandingPage() {
  const { loginWithRedirect } = useAuth0()

  // Auth0 loginWithRedirect() triggers the Universal Login flow.
  // After successful login, Auth0 redirects back to the app and
  // App.jsx's role detection routes the user to the correct MFE.
  const handleSignIn = () => loginWithRedirect()

  // New merchants who don't have an account yet can also use the
  // same Auth0 Universal Login — Auth0 shows both sign-in and sign-up tabs.
  // The 'screen_hint: signup' option pre-selects the registration tab for
  // convenience, reducing friction for new merchant registrations.
  const handleGetStarted = () =>
    loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        // Subtle radial gradient behind the hero to give depth
        backgroundImage:
          'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(108,99,255,0.18) 0%, transparent 70%)',
      }}
    >
      {/* ── Top nav bar ─────────────────────────────────────────────── */}
      <Box
        component="header"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 3, md: 8 },
          py: 2.5,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo wordmark — matches the brand shown in Navbar.jsx */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountBalanceOutlinedIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{
              background: 'linear-gradient(135deg, #6C63FF, #22D3A0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px',
            }}
          >
            PranayBank
          </Typography>
        </Box>

        {/* Sign-in link — secondary emphasis, for returning users */}
        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={handleSignIn}
          sx={{
            borderRadius: 2,
            fontWeight: 600,
            textTransform: 'none',
            px: 2.5,
            borderColor: 'rgba(108,99,255,0.5)',
            '&:hover': { borderColor: 'primary.main', backgroundColor: 'rgba(108,99,255,0.08)' },
          }}
        >
          Sign In
        </Button>
      </Box>

      {/* ── Hero section ────────────────────────────────────────────── */}
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          px: { xs: 3, md: 8 },
          pt: { xs: 8, md: 10 },
          pb: { xs: 6, md: 8 },
        }}
      >
        {/* Status badge — signals product maturity / trust signal */}
        <Chip
          label="Merchant Onboarding Portal"
          size="small"
          sx={{
            mb: 3,
            backgroundColor: 'rgba(108,99,255,0.12)',
            color: 'primary.main',
            fontWeight: 600,
            letterSpacing: 0.5,
            border: '1px solid rgba(108,99,255,0.25)',
          }}
        />

        {/* Primary headline */}
        <Typography
          variant="h2"
          fontWeight={800}
          sx={{
            maxWidth: 680,
            lineHeight: 1.15,
            letterSpacing: '-1.5px',
            mb: 2.5,
            // Gradient text: purple → teal, pulling from the design tokens
            background: 'linear-gradient(135deg, #FFFFFF 30%, #6C63FF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: { xs: '2.4rem', md: '3.5rem' },
          }}
        >
          Start Accepting Payments with PranayBank
        </Typography>

        {/* Supporting copy — explains the value in one sentence */}
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{
            maxWidth: 520,
            lineHeight: 1.6,
            fontWeight: 400,
            mb: 5,
            fontSize: { xs: '1rem', md: '1.15rem' },
          }}
        >
          Complete your merchant onboarding in minutes. Our secure, guided process
          gets your business processing payments faster than ever.
        </Typography>

        {/* CTA button group */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* Primary CTA: new users */}
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleGetStarted}
            sx={{
              px: 5,
              py: 1.6,
              borderRadius: 2.5,
              fontWeight: 700,
              fontSize: '1rem',
              textTransform: 'none',
              boxShadow: '0 0 28px rgba(108, 99, 255, 0.45)',
              '&:hover': {
                boxShadow: '0 0 40px rgba(108, 99, 255, 0.65)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Get Started — It's Free
          </Button>

          {/* Secondary CTA: returning users */}
          <Button
            variant="text"
            color="inherit"
            size="large"
            onClick={handleSignIn}
            sx={{
              px: 4,
              py: 1.6,
              borderRadius: 2.5,
              fontWeight: 600,
              fontSize: '1rem',
              textTransform: 'none',
              color: 'text.secondary',
              '&:hover': { color: 'text.primary', backgroundColor: 'rgba(255,255,255,0.04)' },
              transition: 'all 0.2s ease',
            }}
          >
            Already have an account? Sign in →
          </Button>
        </Box>

        {/* ── Feature cards row ────────────────────────────────────── */}
        <Grid
          container
          spacing={3}
          sx={{ mt: 10, maxWidth: 860 }}
          justifyContent="center"
        >
          {FEATURES.map((feature) => (
            <Grid item xs={12} sm={4} key={feature.title}>
              <FeatureCard {...feature} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <Box
        component="footer"
        sx={{
          textAlign: 'center',
          py: 3,
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.4 }}>
          © {new Date().getFullYear()} PranayBank · All rights reserved · FDIC Insured
        </Typography>
      </Box>
    </Box>
  )
}

// ─── Feature data ──────────────────────────────────────────────────────────
// Defined outside the component so it is not recreated on each render.
// Each entry maps to one FeatureCard in the grid.
const FEATURES = [
  {
    icon: <LockOutlinedIcon sx={{ fontSize: 32, color: '#6C63FF' }} />,
    title: 'Bank-Grade Security',
    body: 'End-to-end encryption, Auth0 SSO, and role-based access keep your data safe at every step.',
    glowColor: 'rgba(108,99,255,0.15)',
  },
  {
    icon: <SpeedOutlinedIcon sx={{ fontSize: 32, color: '#22D3A0' }} />,
    title: 'Minutes, Not Weeks',
    body: 'A guided 6-step wizard auto-saves your progress. Pick up exactly where you left off, anytime.',
    glowColor: 'rgba(34,211,160,0.15)',
  },
  {
    icon: <VerifiedUserOutlinedIcon sx={{ fontSize: 32, color: '#F59E0B' }} />,
    title: 'Real-Time Status',
    body: "Track your application through every review stage and get your Merchant ID the moment you are approved.",
    glowColor: 'rgba(245,158,11,0.15)',
  },
]

// ─── FeatureCard sub-component ──────────────────────────────────────────────
/**
 * Renders a single feature tile in the landing page grid.
 * glass-card class comes from index.css (defined in TASK-9).
 */
function FeatureCard({ icon, title, body, glowColor }) {
  return (
    <Box
      className="glass-card"
      sx={{
        p: 3.5,
        textAlign: 'center',
        height: '100%',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 40px ${glowColor}`,
        },
      }}
    >
      {/* Icon — distinct colour per feature to add visual variety */}
      <Box sx={{ mb: 2 }}>{icon}</Box>

      <Typography variant="subtitle1" fontWeight={700} color="text.primary" gutterBottom>
        {title}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
        {body}
      </Typography>
    </Box>
  )
}

export default LandingPage
