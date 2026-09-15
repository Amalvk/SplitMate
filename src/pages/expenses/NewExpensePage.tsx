import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Mic, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExpenseForm } from '@/components/expense/ExpenseForm'
import { VoiceExpenseEntry } from '@/components/voice/VoiceExpenseEntry'
import { ROUTES } from '@/constants/routes'

export default function NewExpensePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const lockedGroupId = searchParams.get('groupId') ?? undefined
  const [mode, setMode] = useState<'manual' | 'voice'>(searchParams.get('mode') === 'voice' ? 'voice' : 'manual')

  function handleSaved() {
    navigate(lockedGroupId ? ROUTES.group(lockedGroupId) : ROUTES.dashboard)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" /> Back
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Expense</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Split it however makes sense — or just say it.</p>
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as 'manual' | 'voice')}>
        <TabsList className="grid grid-cols-2 w-full max-w-xs">
          <TabsTrigger value="manual">
            <PenLine className="size-4" /> Manual
          </TabsTrigger>
          <TabsTrigger value="voice">
            <Mic className="size-4" /> Voice & Text
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {mode === 'manual' ? (
        <ExpenseForm lockedGroupId={lockedGroupId} onSaved={handleSaved} />
      ) : (
        <VoiceExpenseEntry lockedGroupId={lockedGroupId} onSaved={handleSaved} />
      )}
    </div>
  )
}
