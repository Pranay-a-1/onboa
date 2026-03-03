import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded'
import HighlightOffRoundedIcon from '@mui/icons-material/HighlightOffRounded'

function normalizeStat(value) {
  return Number.isFinite(value) ? value : 0
}

function StatsCards({ stats, isLoading, error }) {
  const total = normalizeStat(stats?.total)
  const submitted = normalizeStat(stats?.submitted)
  const underReview = normalizeStat(stats?.underReview)
  const approved = normalizeStat(stats?.approved)
  const rejected = normalizeStat(stats?.rejected)
  // Pending is the sum of SUBMITTED + UNDER_REVIEW per product requirement.
  const pending = submitted + underReview

  const cardData = [
    {
      key: 'total',
      label: 'Total Applications',
      value: total,
      icon: <AnalyticsOutlinedIcon fontSize="small" />,
      accentClass: 'stats-card--total',
    },
    {
      key: 'pending',
      label: 'Pending',
      value: pending,
      icon: <HourglassTopRoundedIcon fontSize="small" />,
      accentClass: 'stats-card--pending',
    },
    {
      key: 'approved',
      label: 'Approved',
      value: approved,
      icon: <CheckCircleOutlineRoundedIcon fontSize="small" />,
      accentClass: 'stats-card--approved',
    },
    {
      key: 'rejected',
      label: 'Rejected',
      value: rejected,
      icon: <HighlightOffRoundedIcon fontSize="small" />,
      accentClass: 'stats-card--rejected',
    },
  ]

  return (
    <section className="stats-section" aria-label="Dashboard quick stats">
      {error ? (
        <p className="stats-error" role="alert">
          Could not load dashboard stats. Showing fallback values.
        </p>
      ) : null}

      <div className="stats-grid">
        {cardData.map((card) => (
          <article
            key={card.key}
            className={`stats-card ${card.accentClass}`}
            aria-busy={isLoading ? 'true' : 'false'}
          >
            <div className="stats-card__top">
              <span className="stats-card__label">{card.label}</span>
              <span className="stats-card__icon" aria-hidden="true">
                {card.icon}
              </span>
            </div>
            <p className="stats-card__value">{isLoading ? '--' : card.value}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default StatsCards
