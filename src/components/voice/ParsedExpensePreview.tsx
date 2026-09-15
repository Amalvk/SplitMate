import { AlertTriangle, Sparkles } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EXPENSE_CATEGORIES } from '@/constants/categories'
import type { Member } from '@/types'
import type { ParsedExpenseResult } from '@/services/expenseParser'
import { formatINR } from '@/utils/currency'

interface ParsedExpensePreviewProps {
  result: ParsedExpenseResult
  members: Member[]
}

export function ParsedExpensePreview({ result, members }: ParsedExpensePreviewProps) {
  const byId = Object.fromEntries(members.map((m) => [m.id, m]))
  const payerName = result.payers[0] ? byId[result.payers[0].memberId]?.name : undefined
  const categoryMeta = EXPENSE_CATEGORIES[result.category]
  const equalShare = result.splitType === 'equal' && result.participantIds.length > 0 ? Math.round(result.amountMinor / result.participantIds.length) : 0

  return (
    <Card className="border-primary/30 bg-accent/40">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-4" />
          <span className="text-sm font-semibold">I understood</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{categoryMeta.emoji}</span>
            <span className="font-semibold text-lg">{result.title}</span>
          </div>
          <span className="text-xl font-bold num-tabular">{formatINR(result.amountMinor)}</span>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Paid by</p>
          {payerName ? (
            <div className="flex items-center gap-2">
              <Avatar name={payerName} size="sm" />
              <span className="text-sm font-medium">{payerName}</span>
            </div>
          ) : (
            <p className="text-sm text-destructive">Couldn’t identify who paid — please edit.</p>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Split between {result.participantIds.length} {result.participantIds.length === 1 ? 'person' : 'people'}
          </p>
          <div className="flex flex-wrap gap-2">
            {result.participantIds.map((id) => (
              <div key={id} className="flex items-center gap-1.5 rounded-full bg-background border border-border pl-1 pr-3 py-1">
                <Avatar name={byId[id]?.name ?? '?'} size="xs" />
                <span className="text-xs font-medium">{byId[id]?.name ?? 'Unknown'}</span>
                <span className="text-xs text-muted-foreground num-tabular">
                  {formatINR(result.splitInputs?.[id] ?? equalShare)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {(result.warnings.length > 0 || result.unmatchedNames.length > 0) && (
          <div className="flex items-start gap-2 rounded-lg bg-warning/10 text-warning px-3 py-2 text-xs">
            <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              {result.warnings.map((w) => (
                <p key={w}>{w}</p>
              ))}
              {result.unmatchedNames.length > 0 && <p>Couldn’t match: {result.unmatchedNames.join(', ')}</p>}
            </div>
          </div>
        )}

        <Badge variant="outline" className="text-[10px]">
          Heard: “{result.rawText}”
        </Badge>
      </CardContent>
    </Card>
  )
}
