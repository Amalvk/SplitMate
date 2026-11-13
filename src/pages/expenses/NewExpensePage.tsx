import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExpenseForm } from '@/components/expense/ExpenseForm'
import { ROUTES } from '@/constants/routes'

export default function NewExpensePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const lockedGroupId = searchParams.get('groupId') ?? undefined

  function handleSaved() {
    navigate(lockedGroupId ? ROUTES.group(lockedGroupId) : ROUTES.dashboard)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" /> Back
      </Button>

      <div>
        <h1 className="text-xl font-bold tracking-tight">Add Expense</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Split it however makes sense.</p>
      </div>

      <ExpenseForm lockedGroupId={lockedGroupId} onSaved={handleSaved} />
    </div>
  )
}
