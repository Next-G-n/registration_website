import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { getPublicOrgMetadata } from '../../api/publicCheckinApi'
import { Button } from '../../components/Button'
import { KioskBrandHeader } from '../../components/public/KioskBrandHeader'
import { buildBrandCssVars, normalizeBrandingTheme } from '../../utils/branding'

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
    <div className='min-h-screen px-4 py-10' style={buildBrandCssVars(theme)}>
      <div className='mx-auto w-full max-w-3xl space-y-6'>
        <KioskBrandHeader
          theme={theme}
          orgName={orgName}
          logoUrl={logoUrl}
          title='Welcome'
          subtitle='Choose what you need to do today.'
          registrationPointName={registrationPointName}
        />

        <div
          className='kiosk-card mx-auto w-full max-w-2xl text-center shadow-[0_36px_80px_-46px_rgba(15,23,42,0.48)]'
          style={{ borderColor: `${theme.primary_color}40` }}
        >
          <p className='text-xs font-semibold uppercase tracking-[0.3em]' style={{ color: `${theme.text_color}99` }}>Visitor Kiosk</p>
          <div className='mt-6 grid gap-4'>
            <Link to={`/p/${publicKey}/checkin`}>
              <Button size='lg' className='w-full justify-start px-6 py-5 text-left'>
                <span className='text-left'>
                  <span className='block text-xl font-semibold'>Check In</span>
                  <span className='mt-1 block text-sm opacity-80'>Register a new visitor at this kiosk</span>
                </span>
              </Button>
            </Link>
            <Link to={`/p/${publicKey}/checkout`}>
              <Button size='lg' variant='secondary' className='w-full justify-start px-6 py-5 text-left'>
                <span className='text-left'>
                  <span className='block text-xl font-semibold'>Check Out</span>
                  <span className='mt-1 block text-sm opacity-80'>Close an active visit and record departure</span>
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
