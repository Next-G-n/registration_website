import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { getPublicOrgMetadata } from '../../api/publicCheckinApi'
import { Button } from '../../components/Button'
import { KioskBrandHeader } from '../../components/public/KioskBrandHeader'
import { normalizeBrandingTheme } from '../../utils/branding'

export function PublicLandingPage() {
  const { publicKey } = useParams()
  const metadataQuery = useQuery({
    queryKey: ['public-org-metadata', publicKey],
    queryFn: () => getPublicOrgMetadata(publicKey || ''),
    enabled: Boolean(publicKey),
    staleTime: 60_000,
  })

  const orgName = metadataQuery.data?.org_name || 'Organization'
  const registrationPointName = metadataQuery.data?.registration_point?.name
  const theme = normalizeBrandingTheme(
    {
      name: metadataQuery.data?.org_name,
      company_image: metadataQuery.data?.company_image || metadataQuery.data?.logo_url,
      primary_color: metadataQuery.data?.primary_color,
      accent_color: metadataQuery.data?.accent_color,
      background_color: metadataQuery.data?.background_color,
      text_color: metadataQuery.data?.text_color,
    },
    orgName,
  )
  const logoUrl = theme.company_image

  return (
    <div className='min-h-screen px-4 py-10' style={{ background: theme.background_color }}>
      <div className='mx-auto w-full max-w-3xl space-y-6'>
        <KioskBrandHeader
          theme={theme}
          orgName={orgName}
          logoUrl={logoUrl}
          title='Welcome'
          subtitle='Choose what you need to do today.'
          registrationPointName={registrationPointName}
        />

        <div className='kiosk-card mx-auto w-full max-w-xl text-center' style={{ borderColor: `${theme.primary_color}40` }}>
          <p className='text-xs font-semibold uppercase tracking-[0.3em]' style={{ color: `${theme.text_color}99` }}>Visitor Kiosk</p>
          <div className='mt-6 grid gap-4'>
            <Link to={`/p/${publicKey}/checkin`}>
              <Button size='lg' className='w-full text-lg' style={{ backgroundColor: theme.primary_color, color: '#FFFFFF' }}>
                Check In
              </Button>
            </Link>
            <Link to={`/p/${publicKey}/checkout`}>
              <Button
                size='lg'
                variant='secondary'
                className='w-full text-lg'
                style={{ backgroundColor: theme.accent_color, color: '#FFFFFF', borderColor: `${theme.accent_color}CC` }}
              >
                Check Out
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
