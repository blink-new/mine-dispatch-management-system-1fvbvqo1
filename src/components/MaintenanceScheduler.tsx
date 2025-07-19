import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Calendar } from './ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { toast } from 'sonner'
import { blink } from '../blink/client'
import { 
  Wrench, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Plus,
  Settings,
  TrendingUp,
  Activity
} from 'lucide-react'
import { format } from 'date-fns'

interface Equipment {
  id: string
  name: string
  type: 'excavator' | 'dumper' | 'crusher' | 'dumpyard'
  status: 'active' | 'idle' | 'maintenance'
  location: string
  lastMaintenance?: string
  nextMaintenance?: string
  maintenanceHours?: number
  totalHours?: number
}

interface MaintenanceTask {
  id: string
  equipmentId: string
  equipmentName: string
  type: 'preventive' | 'corrective' | 'inspection'
  priority: 'low' | 'medium' | 'high' | 'critical'
  scheduledDate: string
  estimatedDuration: number
  description: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue'
  assignedTechnician?: string
  completedDate?: string
  notes?: string
}

interface MaintenanceSchedulerProps {
  equipment: Equipment[]
  onEquipmentUpdate: () => void
}

export function MaintenanceScheduler({ equipment, onEquipmentUpdate }: MaintenanceSchedulerProps) {
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([])
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadMaintenanceTasks()
  }, [])

  const loadMaintenanceTasks = async () => {
    try {
      setLoading(true)
      const user = await blink.auth.me()
      const data = await blink.db.maintenanceTasks.list({
        where: { userId: user.id },
        orderBy: { scheduledDate: 'asc' }
      })
      
      setMaintenanceTasks(data.map(task => ({
        id: task.id,
        equipmentId: task.equipment_id,
        equipmentName: task.equipment_name,
        type: task.type as MaintenanceTask['type'],
        priority: task.priority as MaintenanceTask['priority'],
        scheduledDate: task.scheduled_date,
        estimatedDuration: task.estimated_duration,
        description: task.description,
        status: task.status as MaintenanceTask['status'],
        assignedTechnician: task.assigned_technician,
        completedDate: task.completed_date,
        notes: task.notes
      })))
    } catch (error) {
      console.error('Failed to load maintenance tasks:', error)
      toast.error('Failed to load maintenance tasks')
    } finally {
      setLoading(false)
    }
  }

  const createMaintenanceTask = async (taskData: Partial<MaintenanceTask>) => {
    try {
      const user = await blink.auth.me()
      const newTask = {
        id: `maint-${Date.now()}`,
        ...taskData,
        userId: user.id,
        createdAt: new Date().toISOString()
      }
      
      await blink.db.maintenanceTasks.create({
        ...newTask,
        equipmentId: newTask.equipmentId,
        equipmentName: newTask.equipmentName,
        scheduledDate: newTask.scheduledDate,
        estimatedDuration: newTask.estimatedDuration,
        assignedTechnician: newTask.assignedTechnician
      })
      
      await loadMaintenanceTasks()
      setIsCreateTaskOpen(false)
      toast.success('Maintenance task scheduled successfully')
    } catch (error) {
      console.error('Failed to create maintenance task:', error)
      toast.error('Failed to schedule maintenance task')
    }
  }

  const updateTaskStatus = async (taskId: string, status: MaintenanceTask['status'], notes?: string) => {
    try {
      const updateData: any = { 
        status,
        updatedAt: new Date().toISOString()
      }
      
      if (status === 'completed') {
        updateData.completedDate = new Date().toISOString()
      }
      
      if (notes) {
        updateData.notes = notes
      }
      
      await blink.db.maintenanceTasks.update(taskId, updateData)
      await loadMaintenanceTasks()
      
      // If task is completed, update equipment status
      if (status === 'completed') {
        const task = maintenanceTasks.find(t => t.id === taskId)
        if (task) {
          await blink.db.equipment.update(task.equipmentId, {
            status: 'idle',
            lastMaintenance: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          onEquipmentUpdate()
        }
      }
      
      toast.success(`Task marked as ${status}`)
    } catch (error) {
      console.error('Failed to update task status:', error)
      toast.error('Failed to update task status')
    }
  }

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'overdue': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'preventive': return <Settings className="h-4 w-4" />
      case 'corrective': return <Wrench className="h-4 w-4" />
      case 'inspection': return <Activity className="h-4 w-4" />
      default: return <Wrench className="h-4 w-4" />
    }
  }

  const upcomingTasks = maintenanceTasks.filter(task => 
    task.status === 'scheduled' && new Date(task.scheduledDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  )

  const overdueTasks = maintenanceTasks.filter(task => 
    task.status === 'scheduled' && new Date(task.scheduledDate) < new Date()
  )

  const inProgressTasks = maintenanceTasks.filter(task => task.status === 'in_progress')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Wrench className="h-6 w-6 mr-2 text-orange-500" />
            Maintenance Scheduler
          </h2>
          <p className="text-muted-foreground">Manage equipment maintenance and inspections</p>
        </div>
        <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Maintenance
            </Button>
          </DialogTrigger>
          <CreateMaintenanceTaskDialog 
            equipment={equipment}
            onCreateTask={createMaintenanceTask}
          />
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-400">{overdueTasks.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-yellow-400">{inProgressTasks.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-blue-400">{upcomingTasks.length}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-400">
                  {maintenanceTasks.filter(t => t.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-400">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Urgent Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...overdueTasks, ...inProgressTasks].length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No urgent tasks</p>
              </div>
            ) : (
              [...overdueTasks, ...inProgressTasks].map((task) => (
                <MaintenanceTaskCard 
                  key={task.id} 
                  task={task} 
                  onUpdateStatus={updateTaskStatus}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-blue-400">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Upcoming Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingTasks.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming tasks</p>
              </div>
            ) : (
              upcomingTasks.map((task) => (
                <MaintenanceTaskCard 
                  key={task.id} 
                  task={task} 
                  onUpdateStatus={updateTaskStatus}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Equipment Maintenance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-orange-500" />
            Equipment Maintenance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {equipment.map((item) => {
              const lastMaintenance = item.lastMaintenance ? new Date(item.lastMaintenance) : null
              const daysSinceLastMaintenance = lastMaintenance 
                ? Math.floor((Date.now() - lastMaintenance.getTime()) / (1000 * 60 * 60 * 24))
                : null
              
              const maintenanceStatus = daysSinceLastMaintenance === null ? 'unknown' :
                daysSinceLastMaintenance > 90 ? 'overdue' :
                daysSinceLastMaintenance > 60 ? 'due_soon' : 'good'
              
              return (
                <div 
                  key={item.id} 
                  className="border border-border rounded-lg p-3 space-y-2 cursor-pointer hover:bg-accent/50"
                  onClick={() => setSelectedEquipment(item)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.name}</span>
                    <Badge className={
                      maintenanceStatus === 'overdue' ? 'bg-red-500/20 text-red-400' :
                      maintenanceStatus === 'due_soon' ? 'bg-yellow-500/20 text-yellow-400' :
                      maintenanceStatus === 'good' ? 'bg-green-500/20 text-green-400' :
                      'bg-gray-500/20 text-gray-400'
                    }>
                      {maintenanceStatus === 'overdue' ? 'Overdue' :
                       maintenanceStatus === 'due_soon' ? 'Due Soon' :
                       maintenanceStatus === 'good' ? 'Good' : 'Unknown'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {lastMaintenance 
                      ? `Last: ${daysSinceLastMaintenance} days ago`
                      : 'No maintenance record'
                    }
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedEquipment(item)
                      setIsCreateTaskOpen(true)
                    }}
                  >
                    Schedule Maintenance
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MaintenanceTaskCard({ 
  task, 
  onUpdateStatus 
}: { 
  task: MaintenanceTask
  onUpdateStatus: (taskId: string, status: MaintenanceTask['status'], notes?: string) => void 
}) {
  const [notes, setNotes] = useState('')
  const [isNotesOpen, setIsNotesOpen] = useState(false)

  const handleStatusUpdate = (status: MaintenanceTask['status']) => {
    if (status === 'completed' && !notes.trim()) {
      setIsNotesOpen(true)
      return
    }
    onUpdateStatus(task.id, status, notes)
    setNotes('')
    setIsNotesOpen(false)
  }

  return (
    <div className="border border-border rounded-lg p-3 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            {getTaskIcon(task.type)}
            <span className="font-medium">{task.equipmentName}</span>
            <Badge className={getPriorityColor(task.priority)}>
              {task.priority}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{task.description}</p>
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <span>📅 {format(new Date(task.scheduledDate), 'MMM dd, yyyy')}</span>
            <span>⏱️ {task.estimatedDuration}h</span>
            {task.assignedTechnician && <span>👤 {task.assignedTechnician}</span>}
          </div>
        </div>
        <Badge className={getTaskStatusColor(task.status)}>
          {task.status.replace('_', ' ')}
        </Badge>
      </div>

      {task.status === 'scheduled' && (
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleStatusUpdate('in_progress')}
          >
            Start
          </Button>
          <Button 
            size="sm" 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => handleStatusUpdate('completed')}
          >
            Complete
          </Button>
        </div>
      )}

      {task.status === 'in_progress' && (
        <Button 
          size="sm" 
          className="bg-green-600 hover:bg-green-700"
          onClick={() => handleStatusUpdate('completed')}
        >
          Mark Complete
        </Button>
      )}

      {isNotesOpen && (
        <div className="space-y-2">
          <Textarea
            placeholder="Add completion notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
          <div className="flex space-x-2">
            <Button 
              size="sm"
              onClick={() => handleStatusUpdate('completed')}
              disabled={!notes.trim()}
            >
              Complete with Notes
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setIsNotesOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function CreateMaintenanceTaskDialog({ 
  equipment, 
  onCreateTask 
}: { 
  equipment: Equipment[]
  onCreateTask: (task: Partial<MaintenanceTask>) => void 
}) {
  const [formData, setFormData] = useState({
    equipmentId: '',
    type: 'preventive' as MaintenanceTask['type'],
    priority: 'medium' as MaintenanceTask['priority'],
    scheduledDate: new Date(),
    estimatedDuration: 4,
    description: '',
    assignedTechnician: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const selectedEquipment = equipment.find(eq => eq.id === formData.equipmentId)
    if (!selectedEquipment) return

    onCreateTask({
      ...formData,
      equipmentName: selectedEquipment.name,
      scheduledDate: formData.scheduledDate.toISOString(),
      status: 'scheduled'
    })
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Schedule Maintenance Task</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Equipment</Label>
          <Select 
            value={formData.equipmentId} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, equipmentId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select equipment" />
            </SelectTrigger>
            <SelectContent>
              {equipment.map(eq => (
                <SelectItem key={eq.id} value={eq.id}>{eq.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Maintenance Type</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as MaintenanceTask['type'] }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="preventive">Preventive</SelectItem>
              <SelectItem value="corrective">Corrective</SelectItem>
              <SelectItem value="inspection">Inspection</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Priority</Label>
          <Select 
            value={formData.priority} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as MaintenanceTask['priority'] }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Scheduled Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(formData.scheduledDate, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.scheduledDate}
                onSelect={(date) => date && setFormData(prev => ({ ...prev, scheduledDate: date }))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label>Estimated Duration (hours)</Label>
          <Input
            type="number"
            value={formData.estimatedDuration}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) }))}
            min="1"
            max="24"
          />
        </div>

        <div>
          <Label>Description</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the maintenance task..."
            rows={3}
          />
        </div>

        <div>
          <Label>Assigned Technician</Label>
          <Input
            value={formData.assignedTechnician}
            onChange={(e) => setFormData(prev => ({ ...prev, assignedTechnician: e.target.value }))}
            placeholder="Technician name"
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-orange-500 hover:bg-orange-600"
          disabled={!formData.equipmentId || !formData.description}
        >
          Schedule Task
        </Button>
      </form>
    </DialogContent>
  )
}

function getTaskIcon(type: string) {
  switch (type) {
    case 'preventive': return <Settings className="h-4 w-4" />
    case 'corrective': return <Wrench className="h-4 w-4" />
    case 'inspection': return <Activity className="h-4 w-4" />
    default: return <Wrench className="h-4 w-4" />
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30'
    case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30'
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}