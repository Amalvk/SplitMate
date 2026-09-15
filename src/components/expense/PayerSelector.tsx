import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { formatINR, minorToRupees, rupeesToMinor } from '@/utils/currency'
import { cn } from '@/utils/cn'
import type { ExpensePayer, Member } from '@/types'

interface PayerSelectorProps {
  members: Member[]
  amountMinor: number
  payers: ExpensePayer[]
  onChange: (payers: ExpensePayer[]) => void
  multiMode: boolean
  onMultiModeChange: (multi: boolean) => void
}

export function PayerSelector({ members, amountMinor, payers, onChange, multiMode, onMultiModeChange }: PayerSelectorProps) {
  const total = payers.reduce((s, p) => s + p.amountMinor, 0)
  const valid = total === amountMinor

  function setSinglePayer(memberId: string) {
    onChange([{ memberId, amountMinor }])
  }

  function toggleMultiPayer(memberId: string, checked: boolean) {
    if (checked) {
      onChange([...payers, { memberId, amountMinor: 0 }])
    } else {
      onChange(payers.filter((p) => p.memberId !== memberId))
    }
  }

  function setMultiAmount(memberId: string, value: number) {
    onChange(payers.map((p) => (p.memberId === memberId ? { ...p, amountMinor: value } : p)))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Paid by</Label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Multiple payers</span>
          <Switch
            checked={multiMode}
            onCheckedChange={(checked) => {
              onMultiModeChange(checked)
              onChange(checked ? [] : members[0] ? [{ memberId: members[0].id, amountMinor }] : [])
            }}
          />
        </div>
      </div>

      {!multiMode ? (
        <Select value={payers[0]?.memberId} onValueChange={setSinglePayer}>
          <SelectTrigger>
            <SelectValue placeholder="Who paid?" />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <>
          <div className="rounded-xl border border-border divide-y divide-border">
            {members.map((member) => {
              const payer = payers.find((p) => p.memberId === member.id)
              return (
                <div key={member.id} className={cn('flex items-center gap-3 px-3 py-2.5', !payer && 'opacity-50')}>
                  <Checkbox checked={!!payer} onCheckedChange={(checked) => toggleMultiPayer(member.id, !!checked)} />
                  <Avatar name={member.name} size="sm" />
                  <span className="text-sm font-medium flex-1 truncate">{member.name}</span>
                  {payer && (
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        className="h-8 w-24 text-right"
                        value={payer.amountMinor ? minorToRupees(payer.amountMinor) : ''}
                        onChange={(e) => setMultiAmount(member.id, rupeesToMinor(Number(e.target.value) || 0))}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className={cn('flex items-center gap-2 rounded-lg px-3 py-2 text-sm', valid ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning')}>
            {valid ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
            <span>
              {formatINR(total)} of {formatINR(amountMinor)} accounted for
            </span>
          </div>
        </>
      )}
    </div>
  )
}
