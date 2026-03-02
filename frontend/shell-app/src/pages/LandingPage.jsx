import { useAuth0 } from '@auth0/auth0-react'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  Chip,
} from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import SecurityIcon from '@mui/icons-material/Security'
import SpeedIcon from '@mui/icons-material/Speed'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'

const features = [
  { icon: <SecurityIcon sx={{ color: '#6C63FF', fontSize: '2rem' }} />, title: 'Bank-Grade Security', desc: 'Auth0-powered SSO with role-based access control' },
  { icon: <SpeedIcon sx={{ color: '#00D4AA', fontSize: '2rem' }} />, title: 'Fast Onboarding', desc: 'Complete your application in under 15 minutes' },
  { icon: <CheckCircleIcon sx={{ color: '#FFB020', fontSize: '2rem' }} />, title: 'Real-Time Status', desc: 'Track every stage of your application review' },
]

export default function LandingPage() {
  const { loginWithRedirect, isAuthenticated, isLoading, user } = useAuth0()
  const navigate = useNavigate()

  // Auto-redirect authenticated users to their correct route
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const roles = user['https://pranaybank.com/roles'] || []
      if (roles.includes('ADMIN')) {
        navigate('/dashboard', { replace: true })
      } else {
        navigate('/onboarding', { replace: true })
      }
    }
  }, [isAuthenticated, isLoading, user, navigate])

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decorations */}
      <Box sx={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at 15% 50%, rgba(108,99,255,0.12) 0%, transparent 55%), radial-gradient(ellipse at 85% 20%, rgba(0,212,170,0.08) 0%, transparent 50%)',
      }} />
      <Box sx={{
        position: 'fixed', top: '10%', right: '-5%', width: 500, height: 500,
        borderRadius: '50%', border: '1px solid rgba(108,99,255,0.08)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 8 }}>
        <Grid container spacing={6} alignItems="center">
          {/* Left — Hero copy */}
          <Grid item xs={12} md={6}>
            <Box className="fade-up">
              <Chip
                label="PranayBank Merchant Portal"
                size="small"
                sx={{
                  background: 'rgba(108, 99, 255, 0.12)',
                  border: '1px solid rgba(108, 99, 255, 0.35)',
                  color: '#9B94FF',
                  fontWeight: 600,
                  mb: 3,
                }}
              />
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.4rem', md: '3.2rem' },
                  fontWeight: 800,
                  lineHeight: 1.15,
                  mb: 2.5,
                  letterSpacing: '-0.02em',
                }}
              >
                Accept Payments{' '}
                <Box component="span" sx={{
                  background: 'linear-gradient(135deg, #6C63FF 0%, #00D4AA 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  with Confidence
                </Box>
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: 'text.secondary', lineHeight: 1.8, mb: 4, fontSize: '1.05rem', maxWidth: 480 }}
              >
                Complete your merchant onboarding application in minutes. Our streamlined process gets you accepting payments faster than ever.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  id="login-cta-btn"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => loginWithRedirect()}
                  disabled={isLoading}
                  sx={{ px: 4, py: 1.5, fontSize: '1rem' }}
                >
                  {isLoading ? 'Loading…' : 'Get Started'}
                </Button>
                <Button
                  id="login-existing-btn"
                  variant="outlined"
                  size="large"
                  onClick={() => loginWithRedirect()}
                  disabled={isLoading}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    borderColor: 'rgba(108,99,255,0.4)',
                    color: '#9B94FF',
                    '&:hover': { borderColor: '#6C63FF', background: 'rgba(108,99,255,0.08)' },
                  }}
                >
                  Sign In
                </Button>
              </Box>
            </Box>
          </Grid>

          {/* Right — Feature cards */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {features.map((feat, i) => (
                <Card
                  key={i}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 0.5,
                    animation: `fadeUp 0.4s ease ${0.1 * i}s both`,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                      transform: 'translateX(4px)',
                      boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 20px rgba(108,99,255,0.15)',
                    },
                  }}
                >
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5, py: '16px !important' }}>
                    <Box sx={{
                      width: 52, height: 52, borderRadius: '14px', flexShrink: 0,
                      background: 'rgba(108,99,255,0.08)',
                      border: '1px solid rgba(108,99,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {feat.icon}
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.3 }}>
                        {feat.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feat.desc}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Grid>
        </Grid>

        {/* Bottom bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 8, opacity: 0.4 }}>
          <AccountBalanceIcon sx={{ fontSize: '0.9rem' }} />
          <Typography variant="caption" sx={{ letterSpacing: '0.05em' }}>
            © 2025 PranayBank · Merchant Services
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}
