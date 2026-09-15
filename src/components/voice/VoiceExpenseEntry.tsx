import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2, Mic, MicOff, Pencil, Send, Square } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ExpenseForm, type ExpenseDraft } from '@/components/expense/ExpenseForm'
import { ParsedExpensePreview } from '@/components/voice/ParsedExpensePreview'
import { expenseParser } from '@/services/expenseParser'
import { voiceInputService } from '@/services/voice'
import { addExpenseAction } from '@/services/actions/expenseActions'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { cn } from '@/utils/cn'
import type { Expense } from '@/types'

interface VoiceExpenseEntryProps {
  lockedGroupId?: string
  onSaved: (expense: Expense) => void
}

const EXAMPLES = [
  'Amal paid 500 for everyone',
  'Rahul paid 300 for Rahul and Arun',
  'Amal paid 1500 for dinner for Amal, Binu and Chetan',
  'Amal paid 500 for everyone except Binu',
]

export function VoiceExpenseEntry({ lockedGroupId, onSaved }: VoiceExpenseEntryProps) {
  const userId = useAuthStore((s) => s.currentUser?.id)
  const groups = useDataStore((s) => s.groups)
  const members = useDataStore((s) => s.members)
  const [confirming, setConfirming] = useState(false)

  const myGroups = useMemo(() => groups.filter((g) => userId && g.memberIds.includes(userId)), [groups, userId])
  const [groupId, setGroupId] = useState(lockedGroupId ?? myGroups[0]?.id ?? '')
  const group = groups.find((g) => g.id === groupId)
  const groupMembers = useMemo(() => (group ? members.filter((m) => group.memberIds.includes(m.id)) : []), [group, members])

  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [textInput, setTextInput] = useState('')
  const [parsed, setParsed] = useState<ReturnType<typeof expenseParser.parseExpense> | null>(null)
  const [editing, setEditing] = useState(false)
  const voiceSupported = voiceInputService.isSupported()

  function runParser(input: string) {
    if (!group) return
    const context = { members: groupMembers.map((m) => ({ id: m.id, name: m.name })), currentUserId: userId }
    const result = expenseParser.parseExpense(input, context)
    setParsed(result)
    setEditing(false)
  }

  function toggleListening() {
    if (listening) {
      voiceInputService.stop()
      setListening(false)
      return
    }
    setTranscript('')
    setParsed(null)
    setListening(true)
    voiceInputService.start({
      onResult: (text, isFinal) => {
        setTranscript(text)
        if (isFinal) {
          runParser(text)
        }
      },
      onError: (message) => {
        toast.error(message)
        setListening(false)
      },
      onEnd: () => setListening(false),
    })
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!textInput.trim()) return
    setTranscript(textInput)
    runParser(textInput)
  }

  async function handleConfirm() {
    if (!parsed || !group || !userId) return
    const now = new Date().toISOString()
    const expense: Expense = {
      id: crypto.randomUUID(),
      groupId: group.id,
      title: parsed.title,
      amountMinor: parsed.amountMinor,
      category: parsed.category,
      date: now,
      payers: parsed.payers,
      split: {
        type: parsed.splitType,
        participantIds: parsed.participantIds,
        inputs: parsed.splitInputs,
        shares:
          parsed.splitInputs ??
          Object.fromEntries(
            parsed.participantIds.map((id, i, arr) => {
              const base = Math.floor(parsed.amountMinor / arr.length)
              const remainder = parsed.amountMinor - base * arr.length
              return [id, base + (i < remainder ? 1 : 0)]
            }),
          ),
      },
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      source: 'voice',
    }
    setConfirming(true)
    try {
      await addExpenseAction(expense, userId, group)
      toast.success('Expense added ✓', { description: `${expense.title} added from voice.` })
      onSaved(expense)
    } catch (err) {
      toast.error('Couldn’t save this expense', { description: err instanceof Error ? err.message : 'Please try again.' })
    } finally {
      setConfirming(false)
    }
  }

  if (myGroups.length === 0) {
    return <p className="text-sm text-muted-foreground">Create a group first before adding an expense.</p>
  }

  if (editing && parsed && group) {
    return (
      <ExpenseForm
        lockedGroupId={group.id}
        draft={
          {
            title: parsed.title,
            amountMinor: parsed.amountMinor,
            category: parsed.category,
            payers: parsed.payers,
            participantIds: parsed.participantIds,
            splitType: parsed.splitType,
            splitInputs: parsed.splitInputs,
            source: 'voice',
          } satisfies ExpenseDraft
        }
        onSaved={onSaved}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <div className="space-y-5">
      {!lockedGroupId && (
        <Select value={groupId} onValueChange={setGroupId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a group" />
          </SelectTrigger>
          <SelectContent>
            {myGroups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="flex flex-col items-center gap-4 py-6">
        <button
          onClick={toggleListening}
          disabled={!voiceSupported}
          className={cn(
            'relative flex size-24 items-center justify-center rounded-full transition-colors disabled:opacity-40',
            listening ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground',
          )}
        >
          {listening && (
            <motion.span
              className="absolute inset-0 rounded-full bg-destructive/40"
              animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
          )}
          {listening ? <Square className="size-7" /> : <Mic className="size-8" />}
        </button>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          {!voiceSupported
            ? 'Voice input isn’t supported in this browser — try typing below instead.'
            : listening
              ? 'Listening... tap to stop'
              : 'Tap and say something like "Amal paid 500 for everyone"'}
        </p>
        {transcript && (
          <p className="text-sm italic text-center bg-secondary rounded-lg px-3 py-2 max-w-sm">“{transcript}”</p>
        )}
        {!voiceSupported && <MicOff className="size-4 text-muted-foreground" />}
      </div>

      <form onSubmit={handleTextSubmit} className="flex gap-2">
        <Input placeholder='Or type it instead: "Aman paid 500 for everyone"' value={textInput} onChange={(e) => setTextInput(e.target.value)} />
        <Button type="submit" size="icon" variant="secondary">
          <Send className="size-4" />
        </Button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => {
              setTextInput(ex)
              setTranscript(ex)
              runParser(ex)
            }}
            className="text-[11px] rounded-full bg-secondary px-2.5 py-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>

      {parsed && group && (
        <div className="space-y-3">
          <ParsedExpensePreview result={parsed} members={groupMembers} />
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setEditing(true)}>
              <Pencil className="size-4" /> Edit Details
            </Button>
            <Button type="button" className="flex-1" onClick={handleConfirm} disabled={!parsed.success} loading={confirming}>
              Confirm Expense <ArrowRight className="size-4" />
            </Button>
          </div>
          {!parsed.success && <p className="text-xs text-destructive text-center">Fix the details above before confirming, or tap Edit Details.</p>}
        </div>
      )}

      {listening && (
        <div className="flex justify-center">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
