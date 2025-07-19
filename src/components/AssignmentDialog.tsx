import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Truck, Pickaxe, Factory, MapPin, Plus } from 'lucide-react'

interface Equipment {
  id: string
  name: string
  type: 'excavator' | 'dumper' | 'crusher' | 'dumpyard'
  status: 'active' | 'idle' | 'maintenance'
  location: string
  operator?: string
  capacity?: number
  currentLoad?: number
  efficiency?: number
}

interface AssignmentDialogProps {
  equipment: Equipment[]
  onCreateAssignment: (assignment: {
    excavatorId: string
    dumperId: string
    crusherId?: string
    dumpyardId: string
    priority: 'high' | 'medium' | 'low'
    estimatedTime: number
  }) => void
  trigger?: React.ReactNode
}

export function AssignmentDialog({ equipment, onCreateAssignment, trigger }: AssignmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [excavatorId, setExcavatorId] = useState('')
  const [dumperId, setDumperId] = useState('')
  const [crusherId, setCrusherId] = useState('')
  const [dumpyardId, setDumpyardId] = useState('')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [estimatedTime, setEstimatedTime] = useState(60)

  const availableExcavators = equipment.filter(eq => eq.type === 'excavator' && eq.status === 'idle')
  const availableDumpers = equipment.filter(eq => eq.type === 'dumper' && eq.status === 'idle')
  const availableCrushers = equipment.filter(eq => eq.type === 'crusher' && eq.status !== 'maintenance')
  const availableDumpyards = equipment.filter(eq => eq.type === 'dumpyard' && eq.status !== 'maintenance')

  const getEquipmentIcon = (type: string) => {
    switch (type) {
      case 'excavator': return <Pickaxe className="h-4 w-4" />
      case 'dumper': return <Truck className="h-4 w-4" />
      case 'crusher': return <Factory className="h-4 w-4" />
      case 'dumpyard': return <MapPin className="h-4 w-4" />
      default: return null
    }
  }

  const handleSubmit = () => {
    if (!excavatorId || !dumperId || !dumpyardId) return

    onCreateAssignment({
      excavatorId,
      dumperId,
      crusherId: crusherId || undefined,
      dumpyardId,
      priority,
      estimatedTime
    })

    // Reset form
    setExcavatorId('')
    setDumperId('')
    setCrusherId('')
    setDumpyardId('')
    setPriority('medium')
    setEstimatedTime(60)
    setOpen(false)
  }

  const isFormValid = excavatorId && dumperId && dumpyardId

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Create Assignment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Assignment</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Excavator Selection */}
          <div className="space-y-2">
            <Label htmlFor="excavator">Excavator *</Label>
            <Select value={excavatorId} onValueChange={setExcavatorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an excavator" />
              </SelectTrigger>
              <SelectContent>
                {availableExcavators.map((excavator) => (
                  <SelectItem key={excavator.id} value={excavator.id}>
                    <div className="flex items-center space-x-2">
                      {getEquipmentIcon(excavator.type)}
                      <span>{excavator.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {excavator.location}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableExcavators.length === 0 && (
              <p className="text-sm text-muted-foreground">No idle excavators available</p>
            )}
          </div>

          {/* Dumper Selection */}
          <div className="space-y-2">
            <Label htmlFor="dumper">Dumper *</Label>
            <Select value={dumperId} onValueChange={setDumperId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a dumper" />
              </SelectTrigger>
              <SelectContent>
                {availableDumpers.map((dumper) => (
                  <SelectItem key={dumper.id} value={dumper.id}>
                    <div className="flex items-center space-x-2">
                      {getEquipmentIcon(dumper.type)}
                      <span>{dumper.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {dumper.capacity}t
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableDumpers.length === 0 && (
              <p className="text-sm text-muted-foreground">No idle dumpers available</p>
            )}
          </div>

          {/* Crusher Selection (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="crusher">Crusher (Optional)</Label>
            <Select value={crusherId} onValueChange={setCrusherId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a crusher (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No crusher</SelectItem>
                {availableCrushers.map((crusher) => (
                  <SelectItem key={crusher.id} value={crusher.id}>
                    <div className="flex items-center space-x-2">
                      {getEquipmentIcon(crusher.type)}
                      <span>{crusher.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {crusher.capacity}tph
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dumpyard Selection */}
          <div className="space-y-2">
            <Label htmlFor="dumpyard">Dump Yard *</Label>
            <Select value={dumpyardId} onValueChange={setDumpyardId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a dump yard" />
              </SelectTrigger>
              <SelectContent>
                {availableDumpyards.map((dumpyard) => (
                  <SelectItem key={dumpyard.id} value={dumpyard.id}>
                    <div className="flex items-center space-x-2">
                      {getEquipmentIcon(dumpyard.type)}
                      <span>{dumpyard.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {((dumpyard.currentLoad || 0) / (dumpyard.capacity || 1) * 100).toFixed(0)}% full
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority Selection */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={(value: 'high' | 'medium' | 'low') => setPriority(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">
                  <Badge variant="destructive" className="text-xs">High Priority</Badge>
                </SelectItem>
                <SelectItem value="medium">
                  <Badge variant="secondary" className="text-xs">Medium Priority</Badge>
                </SelectItem>
                <SelectItem value="low">
                  <Badge variant="outline" className="text-xs">Low Priority</Badge>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Estimated Time */}
          <div className="space-y-2">
            <Label htmlFor="time">Estimated Time (minutes)</Label>
            <Input
              type="number"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(Number(e.target.value))}
              min={1}
              max={480}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!isFormValid}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Create Assignment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}