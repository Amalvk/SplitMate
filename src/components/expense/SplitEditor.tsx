import { CheckCircle2, AlertCircle } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  calculateCustomSplit,
  calculateEqualSplit,
  calculatePercentageSplit,
  calculateShareSplit,
} from '@/utils/calculations'
import { formatINR, minorToRupees, rupeesToMinor } from '@/utils/currency'
import { cn } from '@/utils/cn'
import type { Member, SplitType } from '@/types'

interface SplitEditorProps {
  members: Member[]
  amountMinor: number
  splitType: SplitType
  onSplitTypeChange: (type: SplitType) => void
  participantIds: string[]
  onParticipantsChange: (ids: string[]) => void
  inputs: Record<string, number>
  onInputsChange: (inputs: Record<string, number>) => void
}

const SPLIT_TABS: { value: SplitType; label: string }[] = [
  { value: 'equal', label: 'Equal' },
  { value: 'unequal', label: 'Unequal' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'shares', label: 'Shares' },
]

export function SplitEditor({
  members,
  amountMinor,
  splitType,
  onSplitTypeChange,
  participantIds,
  onParticipantsChange,
  inputs,
  onInputsChange,
}: SplitEditorProps) {
  function toggleParticipant(id: string) {
    if (participantIds.includes(id)) {
      onParticipantsChange(participantIds.filter((x) => x !== id))
    } else {
      onParticipantsChange([...participantIds, id])
    }
  }

  function setInput(id: string, value: number) {
    onInputsChange({ ...inputs, [id]: value })
  }

  const relevantInputs = Object.fromEntries(participantIds.map((id) => [id, inputs[id] ?? 0]))

  const result =
    splitType === 'equal'
      ? calculateEqualSplit(amountMinor, participantIds)
      : splitType === 'unequal'
        ? calculateCustomSplit(amountMinor, relevantInputs)
        : splitType === 'percentage'
          ? calculatePercentageSplit(amountMinor, relevantInputs)
          : calculateShareSplit(amountMinor, relevantInputs)

  const percentTotal = splitType === 'percentage' ? Object.values(relevantInputs).reduce((s, v) => s + v, 0) : 0
  const unequalTotal = splitType === 'unequal' ? Object.values(relevantInputs).reduce((s, v) => s + v, 0) : 0

  return (
    <div className="space-y-4">
      <Tabs value={splitType} onValueChange={(v) => onSplitTypeChange(v as SplitType)}>
        <TabsList className="grid grid-cols-4 w-full">
          {SPLIT_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="rounded-xl border border-border divide-y divide-border">
        {members.map((member) => {
          const selected = participantIds.includes(member.id)
          return (
            <div key={member.id} className={cn('flex items-center gap-3 px-3 py-2.5', !selected && 'opacity-50')}>
              <Checkbox checked={selected} onCheckedChange={() => toggleParticipant(member.id)} />
              <Avatar name={member.name} size="sm" />
              <span className="text-sm font-medium flex-1 truncate">{member.name}</span>

              {selected && splitType === 'equal' && (
                <span className="text-sm font-semibold num-tabular text-muted-foreground">
                  {formatINR(result.shares[member.id] ?? 0)}
                </span>
              )}

              {selected && splitType === 'unequal' && (
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">₹</span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    className="h-8 w-24 text-right"
                    value={inputs[member.id] ? minorToRupees(inputs[member.id]) : ''}
                    onChange={(e) => setInput(member.id, rupeesToMinor(Number(e.target.value) || 0))}
                  />
                </div>
              )}

              {selected && splitType === 'percentage' && (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    className="h-8 w-20 text-right"
                    value={inputs[member.id] || ''}
                    onChange={(e) => setInput(member.id, Number(e.target.value) || 0)}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              )}

              {selected && splitType === 'shares' && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    className="h-8 w-16 text-right"
                    value={inputs[member.id] || ''}
                    onChange={(e) => setInput(member.id, Number(e.target.value) || 0)}
                  />
                  <span className="text-xs text-muted-foreground w-16 text-right num-tabular">
                    {formatINR(result.shares[member.id] ?? 0)}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {splitType !== 'equal' && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
            result.valid ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning',
          )}
        >
          {result.valid ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
          {splitType === 'unequal' && (
            <span>
              {formatINR(unequalTotal)} of {formatINR(amountMinor)} allocated
              {!result.valid && ` — ${formatINR(Math.abs(amountMinor - unequalTotal))} ${unequalTotal > amountMinor ? 'over' : 'remaining'}`}
            </span>
          )}
          {splitType === 'percentage' && (
            <span>
              {percentTotal.toFixed(2)}% of 100% allocated
              {!result.valid && ` — ${(100 - percentTotal).toFixed(2)}% remaining`}
            </span>
          )}
          {splitType === 'shares' && <span>{result.valid ? 'Shares look good.' : result.error}</span>}
        </div>
      )}

      {participantIds.length === 0 && <p className="text-sm text-destructive">Select at least one participant.</p>}
    </div>
  )
}
