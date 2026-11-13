import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ExpensePayer, Member } from '@/types'

interface PayerSelectorProps {
  members: Member[]
  amountMinor: number
  payers: ExpensePayer[]
  onChange: (payers: ExpensePayer[]) => void
}

export function PayerSelector({ members, amountMinor, payers, onChange }: PayerSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>
        Paid by <span className="text-destructive">*</span>
      </Label>
      <Select value={payers[0]?.memberId ?? ''} onValueChange={(memberId) => onChange([{ memberId, amountMinor }])}>
        <SelectTrigger>
          <SelectValue placeholder="Who paid?" />
        </SelectTrigger>
        <SelectContent>
          {members.map((m, i) => (
            <SelectItem key={m.id} value={m.id}>
              {i + 1}. {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
