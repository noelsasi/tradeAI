import { useState } from 'react'

import { Btn } from '@/common/components/atoms/btn'
import {
  IconCheck,
  IconCode,
  IconCopy,
  IconDownload,
  IconFile,
  IconLink,
  IconWebhook,
} from '@/common/components/atoms/icons'
import { COLORS } from '@/common/config/theme'
import { useToastStore } from '@/store/toast-store'

const ENDPOINT = 'https://api.nexavine.io/v1/tradeai/classify'

const SAMPLE_JSON = `{
  "client": "Shippify UAE",
  "documents": ["invoice.pdf"],
  "options": {
    "format": "gcc_12_digit",
    "sanctions_screen": true,
    "output": "mirsal2"
  }
}`

const EXPORT_FORMATS = [
  { key: 'csv', label: 'CSV', desc: 'Spreadsheet-ready, all columns' },
  { key: 'xlsx', label: 'Excel (XLSX)', desc: 'Formatted workbook with risk tabs' },
  { key: 'xml', label: 'Mirsal 2 XML', desc: 'Dubai Customs declaration format' },
]

const COMING_SOON = ['Mirsal 2 Direct Submit', 'CargoWise', 'Freight Tiger', 'Email Trigger']

// ─── Card header helper ────────────────────────────────────────────────────────

function CardHeader({
  Icon,
  title,
  desc,
}: {
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  title: string
  desc: string
}) {
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-1">
        <span
          className="flex items-center justify-center rounded-[10px]"
          style={{ width: 36, height: 36, background: '#EFF4FF', color: COLORS.accent }}
        >
          <Icon size={19} strokeWidth={2} />
        </span>
        <span className="font-bold" style={{ fontSize: 16, color: COLORS.navy }}>
          {title}
        </span>
      </div>
      <div className="leading-[1.45]" style={{ fontSize: 13, color: COLORS.muted }}>
        {desc}
      </div>
    </div>
  )
}

// ─── API card ─────────────────────────────────────────────────────────────────

function ApiCard() {
  const [copied, setCopied] = useState<'ep' | 'json' | ''>('')
  const addToast = useToastStore((s) => s.addToast)

  function copy(key: 'ep' | 'json', value: string) {
    navigator.clipboard?.writeText(value)
    setCopied(key)
    addToast('Copied to clipboard!')
    setTimeout(() => setCopied(''), 1400)
  }

  return (
    <div className="card">
      <CardHeader Icon={IconCode} title="API Access" desc="POST documents and receive classified line items as JSON." />

      {/* Endpoint */}
      <div>
        <div className="field-label">Endpoint</div>
        <div
          className="flex items-center gap-2 rounded-[9px]"
          style={{
            background: '#F8FAFC',
            border: '1px solid #E8EDF3',
            padding: '9px 11px',
          }}
        >
          <span className="font-mono font-bold" style={{ fontSize: 11, color: '#15803D' }}>
            POST
          </span>
          <span
            className="font-mono flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
            style={{ fontSize: 12, color: COLORS.navy }}
          >
            {ENDPOINT}
          </span>
          <button
            onClick={() => copy('ep', ENDPOINT)}
            title="Copy endpoint"
            className="flex border-0 bg-transparent cursor-pointer p-0"
            style={{ color: copied === 'ep' ? '#15803D' : COLORS.subtle }}
          >
            {copied === 'ep' ? (
              <IconCheck size={15} strokeWidth={2.4} />
            ) : (
              <IconCopy size={15} strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      {/* Sample request */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="field-label">Sample Request</span>
          <button
            onClick={() => copy('json', SAMPLE_JSON)}
            className="flex items-center gap-1 border-0 bg-transparent cursor-pointer font-semibold"
            style={{
              fontSize: 11.5,
              fontFamily: 'inherit',
              color: copied === 'json' ? '#15803D' : COLORS.subtle,
            }}
          >
            {copied === 'json' ? (
              <IconCheck size={13} strokeWidth={2.4} />
            ) : (
              <IconCopy size={13} strokeWidth={2} />
            )}
            {copied === 'json' ? 'Copied' : 'Copy'}
          </button>
        </div>
        <pre
          className="m-0 rounded-[10px] overflow-x-auto font-mono"
          style={{
            background: COLORS.navy,
            color: '#CBD5E1',
            padding: '13px 14px',
            fontSize: 11.5,
            lineHeight: 1.6,
          }}
        >
          {SAMPLE_JSON}
        </pre>
      </div>
    </div>
  )
}

// ─── Export card ──────────────────────────────────────────────────────────────

function ExportCard() {
  const addToast = useToastStore((s) => s.addToast)
  return (
    <div className="card">
      <CardHeader
        Icon={IconDownload}
        title="Export Formats"
        desc="Download the current report in the format your team needs."
      />
      <div className="flex flex-col gap-[9px]">
        {EXPORT_FORMATS.map(({ key, label, desc }) => (
          <div
            key={key}
            className="flex items-center gap-3 rounded-[10px]"
            style={{ border: '1px solid #EEF2F6', padding: '11px 13px' }}
          >
            <span
              className="flex items-center justify-center rounded-lg shrink-0"
              style={{ width: 30, height: 30, background: '#F1F5F9', color: '#475569' }}
            >
              <IconFile size={15} strokeWidth={2} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-[650]" style={{ fontSize: 13.5, color: COLORS.navy }}>
                {label}
              </div>
              <div style={{ fontSize: 11.5, color: COLORS.subtle }}>{desc}</div>
            </div>
            <Btn kind="subtle" sm icon={IconDownload} onClick={() => addToast(`${label} download started`)}>
              Download
            </Btn>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Webhook card ─────────────────────────────────────────────────────────────

function WebhookCard() {
  const [hookUrl, setHookUrl] = useState('')
  const [hookOn, setHookOn] = useState(false)
  const [saved, setSaved] = useState(false)
  const addToast = useToastStore((s) => s.addToast)

  function handleSave() {
    setSaved(true)
    addToast('Webhook saved successfully!')
    setTimeout(() => setSaved(false), 1600)
  }

  return (
    <div className="card">
      <CardHeader
        Icon={IconWebhook}
        title="Webhook / Auto-push"
        desc="Fire a POST to your endpoint when a classification completes."
      />

      {/* URL input */}
      <div>
        <div className="field-label">Payload URL</div>
        <input
          value={hookUrl}
          onChange={(e) => setHookUrl(e.target.value)}
          placeholder="https://ops.shippify.ae/hooks/tradeai"
          className="w-full rounded-[9px] outline-none box-border font-mono"
          style={{
            padding: '9px 12px',
            border: '1px solid #E2E8F0',
            fontSize: 12.5,
            color: COLORS.navy,
          }}
        />
      </div>

      {/* Trigger toggle row */}
      <div
        className="flex items-center gap-[11px] rounded-[10px]"
        style={{ border: '1px solid #EEF2F6', padding: '11px 13px' }}
      >
        <div className="flex-1">
          <div className="font-semibold" style={{ fontSize: 13, color: COLORS.navy }}>
            Trigger on classification complete
          </div>
          <div style={{ fontSize: 11.5, color: COLORS.subtle }}>Sends full JSON report</div>
        </div>
        <button
          onClick={() => setHookOn((o) => !o)}
          aria-pressed={hookOn}
          aria-label="Toggle webhook trigger"
          className="relative border-0 cursor-pointer shrink-0"
          style={{
            width: 42,
            height: 24,
            borderRadius: 999,
            background: hookOn ? COLORS.accent : '#CBD5E1',
            transition: 'background 0.18s',
            padding: 0,
          }}
        >
          <span
            className="absolute rounded-full"
            style={{
              top: 3,
              left: hookOn ? 21 : 3,
              width: 18,
              height: 18,
              background: '#fff',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              transition: 'left 0.18s',
            }}
          />
        </button>
      </div>

      <Btn
        kind={saved ? 'ghost' : 'primary'}
        icon={saved ? IconCheck : IconLink}
        onClick={handleSave}
        style={{ width: '100%' }}
      >
        {saved ? 'Webhook Saved!' : 'Save Webhook'}
      </Btn>
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function IntegrationScreen() {
  return (
    <>
      {/* Scoped card styles — avoids polluting global */}
      <style>{`
        .card {
          background: #fff;
          border: 1px solid #E8EDF3;
          border-radius: 16px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .field-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #94A3B8;
          margin-bottom: 6px;
        }
      `}</style>

      <div className="mx-auto px-7 pb-14" style={{ maxWidth: 1180, paddingTop: 40 }}>
        {/* Page header */}
        <h2
          className="font-bold tracking-tight m-0"
          style={{ fontSize: 30, color: COLORS.navy }}
        >
          Connect TradeAI to Your Workflow
        </h2>
        <p
          className="mt-2.5 mb-0 leading-relaxed"
          style={{ fontSize: 15.5, color: COLORS.muted, maxWidth: 580 }}
        >
          Push classifications straight into your customs and freight stack. No login required
          for this demo.
        </p>

        {/* Three cards */}
        <div
          className="grid gap-4 mt-[30px]"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))' }}
        >
          <ApiCard />
          <ExportCard />
          <WebhookCard />
        </div>

        {/* Coming soon */}
        <div className="mt-[34px]">
          <div
            className="font-bold uppercase tracking-[0.06em] mb-[14px]"
            style={{ fontSize: 12, color: COLORS.subtle }}
          >
            Coming Soon
          </div>
          <div className="flex flex-wrap gap-3">
            {COMING_SOON.map((label) => (
              <div
                key={label}
                className="flex items-center gap-2.5 rounded-xl"
                style={{
                  padding: '13px 16px',
                  background: '#F8FAFC',
                  border: '1px dashed #CBD5E1',
                  flex: '1 1 200px',
                }}
              >
                <span
                  className="flex items-center justify-center rounded-lg shrink-0"
                  style={{
                    width: 30,
                    height: 30,
                    background: '#fff',
                    border: '1px solid #E2E8F0',
                    color: COLORS.subtle,
                  }}
                >
                  <IconLink size={15} strokeWidth={2} />
                </span>
                <span className="font-semibold" style={{ fontSize: 13.5, color: '#475569' }}>
                  {label}
                </span>
                <span
                  className="ml-auto font-bold uppercase tracking-[0.05em] rounded-full"
                  style={{
                    fontSize: 10.5,
                    color: COLORS.subtle,
                    background: '#fff',
                    border: '1px solid #E2E8F0',
                    padding: '3px 8px',
                  }}
                >
                  SOON
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
