import { useState, useEffect } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Progress } from './components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog'
import { Input } from './components/ui/input'
import { Label } from './components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
import { toast } from 'sonner'
import { Toaster } from './components/ui/sonner'
import { blink } from './blink/client'
import { MaintenanceScheduler } from './components/MaintenanceScheduler'
import { AnalyticsDashboard } from './components/AnalyticsDashboard'
import { RouteOptimizer } from './components/RouteOptimizer'
import { 
  Truck, 
  Pickaxe, 
  Factory, 
  MapPin, 
  Activity, 
  Clock, 
  Users, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  BarChart3,
  Zap,
  Plus,
  RefreshCw,
  Play,
  Pause,
  Wrench
} from 'lucide-react'

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
  lastMaintenance?: string
}

interface Assignment {
  id: string
  excavatorId: string
  dumperId: string
  crusherId?: string
  dumpyardId: string
  priority: 'high' | 'medium' | 'low'
  estimatedTime: number
  progress: number
  status: 'pending' | 'active' | 'completed' | 'cancelled'
}

interface ProductionMetrics {
  tonsPerHour: number
  dailyTotal: number
  targetPercentage: number
  equipmentUtilization: number
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [activeView, setActiveView] = useState('dispatch')
  const [draggedItem, setDraggedItem] = useState<Equipment | null>(null)
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false)
  const [productionMetrics, setProductionMetrics] = useState<ProductionMetrics>({
    tonsPerHour: 2450,
    dailyTotal: 18200,
    targetPercentage: 76,
    equipmentUtilization: 82
  })

  // Auth state management
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  // Load equipment data
  useEffect(() => {
    if (!user) return
    loadEquipment()
    loadAssignments()
    
    // Set up real-time updates
    const interval = setInterval(() => {
      updateProductionMetrics()
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadEquipment = async () => {
    try {
      const data = await blink.db.equipment.list({
        where: { userId: user.id },
        orderBy: { type: 'asc' }
      })
      
      if (data.length === 0) {
        // Initialize with sample data if no equipment exists
        await initializeSampleData()
        return
      }
      
      setEquipment(data.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type as Equipment['type'],
        status: item.status as Equipment['status'],
        location: item.location,
        operator: item.operator,
        capacity: item.capacity,
        currentLoad: item.current_load,
        efficiency: item.efficiency,
        lastMaintenance: item.last_maintenance
      })))
    } catch (error) {
      console.error('Failed to load equipment:', error)
      toast.error('Failed to load equipment data')
    }
  }

  const loadAssignments = async () => {
    try {
      const data = await blink.db.assignments.list({
        where: { userId: user.id, status: 'active' },
        orderBy: { createdAt: 'desc' }
      })
      
      setAssignments(data.map(item => ({
        id: item.id,
        excavatorId: item.excavator_id,
        dumperId: item.dumper_id,
        crusherId: item.crusher_id,
        dumpyardId: item.dumpyard_id,
        priority: item.priority as Assignment['priority'],
        estimatedTime: item.estimated_time,
        progress: item.progress,
        status: item.status as Assignment['status']
      })))
    } catch (error) {
      console.error('Failed to load assignments:', error)
    }
  }

  const initializeSampleData = async () => {
    const sampleEquipment = [
      // Excavators
      { id: 'exc-001', name: 'CAT 390F', type: 'excavator', status: 'active', location: 'Bench 1', operator: 'John Smith', capacity: 4.5, current_load: 3.8, efficiency: 85 },
      { id: 'exc-002', name: 'Komatsu PC800', type: 'excavator', status: 'idle', location: 'Bench 2', operator: 'Mike Johnson', capacity: 5.2, current_load: 0, efficiency: 92 },
      { id: 'exc-003', name: 'Hitachi EX1200', type: 'excavator', status: 'maintenance', location: 'Workshop', capacity: 6.0, efficiency: 0, last_maintenance: '2024-01-15' },
      
      // Dumpers
      { id: 'dum-001', name: 'CAT 777G', type: 'dumper', status: 'active', location: 'Route A', operator: 'Sarah Wilson', capacity: 100, current_load: 85, efficiency: 88 },
      { id: 'dum-002', name: 'Komatsu HD785', type: 'dumper', status: 'active', location: 'Route B', operator: 'David Brown', capacity: 91, current_load: 91, efficiency: 95 },
      { id: 'dum-003', name: 'CAT 775G', type: 'dumper', status: 'idle', location: 'Parking', operator: 'Lisa Davis', capacity: 70, current_load: 0, efficiency: 90 },
      { id: 'dum-004', name: 'Volvo A60H', type: 'dumper', status: 'maintenance', location: 'Workshop', capacity: 55, efficiency: 0 },
      
      // Crushers
      { id: 'cru-001', name: 'Primary Crusher', type: 'crusher', status: 'active', location: 'Plant 1', capacity: 2000, current_load: 1650, efficiency: 82 },
      { id: 'cru-002', name: 'Secondary Crusher', type: 'crusher', status: 'active', location: 'Plant 1', capacity: 1500, current_load: 1200, efficiency: 80 },
      { id: 'cru-003', name: 'Tertiary Crusher', type: 'crusher', status: 'idle', location: 'Plant 2', capacity: 1000, current_load: 0, efficiency: 0 },
      
      // Dump Yards
      { id: 'yard-001', name: 'Waste Dump A', type: 'dumpyard', status: 'active', location: 'North Zone', capacity: 50000, current_load: 32000, efficiency: 64 },
      { id: 'yard-002', name: 'Ore Stockpile', type: 'dumpyard', status: 'active', location: 'Processing Area', capacity: 25000, current_load: 18500, efficiency: 74 },
      { id: 'yard-003', name: 'Waste Dump B', type: 'dumpyard', status: 'idle', location: 'South Zone', capacity: 40000, current_load: 5000, efficiency: 12 }
    ]

    try {
      await blink.db.equipment.createMany(
        sampleEquipment.map(item => ({ ...item, userId: user.id }))
      )
      await loadEquipment()
      toast.success('Sample equipment data initialized')
    } catch (error) {
      console.error('Failed to initialize sample data:', error)
    }
  }

  const updateProductionMetrics = () => {
    // Simulate real-time production updates
    setProductionMetrics(prev => ({
      tonsPerHour: prev.tonsPerHour + (Math.random() - 0.5) * 100,
      dailyTotal: prev.dailyTotal + Math.random() * 50,
      targetPercentage: Math.min(100, prev.targetPercentage + (Math.random() - 0.5) * 2),
      equipmentUtilization: Math.min(100, prev.equipmentUtilization + (Math.random() - 0.5) * 3)
    }))
  }

  const updateEquipmentStatus = async (equipmentId: string, newStatus: Equipment['status']) => {
    try {
      await blink.db.equipment.update(equipmentId, { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      })
      
      // Log the status change
      await blink.db.equipmentLogs.create({
        id: `log-${Date.now()}`,
        equipmentId,
        newStatus,
        userId: user.id
      })
      
      await loadEquipment()
      toast.success(`Equipment status updated to ${newStatus}`)
    } catch (error) {
      console.error('Failed to update equipment status:', error)
      toast.error('Failed to update equipment status')
    }
  }

  const createAssignment = async (assignmentData: Partial<Assignment>) => {
    try {
      const newAssignment = {
        id: `assign-${Date.now()}`,
        ...assignmentData,
        status: 'pending',
        progress: 0,
        userId: user.id
      }
      
      await blink.db.assignments.create({
        ...newAssignment,
        excavatorId: newAssignment.excavatorId,
        dumperId: newAssignment.dumperId,
        crusherId: newAssignment.crusherId,
        dumpyardId: newAssignment.dumpyardId,
        estimatedTime: newAssignment.estimatedTime,
        priority: newAssignment.priority
      })
      
      await loadAssignments()
      setIsCreateAssignmentOpen(false)
      toast.success('Assignment created successfully')
    } catch (error) {
      console.error('Failed to create assignment:', error)
      toast.error('Failed to create assignment')
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const draggedEquipment = equipment.find(eq => eq.id === active.id)
    setDraggedItem(draggedEquipment || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedItem(null)
    
    if (!over) return
    
    // Handle equipment assignment via drag and drop
    if (over.id === 'assignment-zone') {
      const draggedEquipment = equipment.find(eq => eq.id === active.id)
      if (draggedEquipment && draggedEquipment.status === 'idle') {
        setSelectedEquipment(draggedEquipment)
        setIsCreateAssignmentOpen(true)
      }
    }
  }

  const getEquipmentIcon = (type: string) => {
    switch (type) {
      case 'excavator': return <Pickaxe className="h-4 w-4" />
      case 'dumper': return <Truck className="h-4 w-4" />
      case 'crusher': return <Factory className="h-4 w-4" />
      case 'dumpyard': return <MapPin className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'status-active'
      case 'idle': return 'status-idle'
      case 'maintenance': return 'status-maintenance'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3" />
      case 'idle': return <Clock className="h-3 w-3" />
      case 'maintenance': return <XCircle className="h-3 w-3" />
      default: return <AlertTriangle className="h-3 w-3" />
    }
  }

  const filterEquipmentByType = (type: string) => {
    return equipment.filter(eq => eq.type === type)
  }

  const getFleetMetrics = () => {
    const total = equipment.length
    const active = equipment.filter(eq => eq.status === 'active').length
    const idle = equipment.filter(eq => eq.status === 'idle').length
    const maintenance = equipment.filter(eq => eq.status === 'maintenance').length
    const avgEfficiency = equipment.reduce((acc, eq) => acc + (eq.efficiency || 0), 0) / total

    return { total, active, idle, maintenance, avgEfficiency }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-muted-foreground">Loading Mine Dispatch System...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <Pickaxe className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <h2 className="text-xl font-bold mb-2">Mine Dispatch System</h2>
            <p className="text-muted-foreground mb-4">Please sign in to access the dispatch control panel</p>
            <Button onClick={() => blink.auth.login()} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const metrics = getFleetMetrics()

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-background text-foreground">
        {/* Top Navigation */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Pickaxe className="h-8 w-8 text-orange-500" />
                <h1 className="text-2xl font-bold">Mine Dispatch Control</h1>
              </div>
              <Badge variant="outline" className="text-green-400 border-green-500/30">
                System Online
              </Badge>
              <Badge variant="outline" className="text-blue-400 border-blue-500/30">
                {user.email}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">
                Shift: Day | Real-time Updates
              </div>
              <Button variant="outline" size="sm" onClick={() => blink.auth.logout()}>
                <Settings className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="border-b border-border bg-card/30">
          <div className="flex items-center px-6 py-2">
            <Button 
              variant={activeView === 'dispatch' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setActiveView('dispatch')}
              className="mr-2"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Dispatch Control
            </Button>
            <Button 
              variant={activeView === 'maintenance' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setActiveView('maintenance')}
              className="mr-2"
            >
              <Wrench className="h-4 w-4 mr-2" />
              Maintenance
            </Button>
            <Button 
              variant={activeView === 'routes' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setActiveView('routes')}
              className="mr-2"
            >
              <Truck className="h-4 w-4 mr-2" />
              Route Optimizer
            </Button>
            <Button 
              variant={activeView === 'analytics' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setActiveView('analytics')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>
        </div>

        {activeView === 'dispatch' && (
          <div className="flex h-[calc(100vh-113px)]">
          {/* Left Sidebar - Equipment Lists */}
          <div className="w-80 border-r border-border bg-card/30 overflow-y-auto">
            <div className="p-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="equipment">Equipment</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4 mt-4">
                  {/* Fleet Metrics */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2 text-orange-500" />
                        Fleet Status
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-auto"
                          onClick={loadEquipment}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">{metrics.active}</div>
                          <div className="text-xs text-muted-foreground">Active</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-400">{metrics.idle}</div>
                          <div className="text-xs text-muted-foreground">Idle</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-400">{metrics.maintenance}</div>
                          <div className="text-xs text-muted-foreground">Maintenance</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-400">{metrics.total}</div>
                          <div className="text-xs text-muted-foreground">Total</div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Fleet Efficiency</span>
                          <span>{metrics.avgEfficiency.toFixed(1)}%</span>
                        </div>
                        <Progress value={metrics.avgEfficiency} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Active Assignments */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <Zap className="h-5 w-5 mr-2 text-blue-500" />
                        Active Assignments
                        <Dialog open={isCreateAssignmentOpen} onOpenChange={setIsCreateAssignmentOpen}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="ml-auto">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <CreateAssignmentDialog 
                            equipment={equipment}
                            onCreateAssignment={createAssignment}
                            selectedEquipment={selectedEquipment}
                          />
                        </Dialog>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {assignments.length === 0 ? (
                        <div className="text-center text-muted-foreground py-4">
                          <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No active assignments</p>
                          <p className="text-xs">Create new assignments to get started</p>
                        </div>
                      ) : (
                        assignments.map((assignment) => {
                          const excavator = equipment.find(eq => eq.id === assignment.excavatorId)
                          const dumper = equipment.find(eq => eq.id === assignment.dumperId)
                          return (
                            <div key={assignment.id} className="border border-border rounded-md p-3 space-y-2">
                              <div className="flex justify-between items-center">
                                <Badge variant={assignment.priority === 'high' ? 'destructive' : 'secondary'}>
                                  {assignment.priority}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{assignment.estimatedTime}min</span>
                              </div>
                              <div className="text-sm">
                                <div>{excavator?.name} → {dumper?.name}</div>
                              </div>
                              <Progress value={assignment.progress} className="h-1" />
                            </div>
                          )
                        })
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="equipment" className="space-y-4 mt-4">
                  {/* Equipment by Type */}
                  {['excavator', 'dumper', 'crusher', 'dumpyard'].map((type) => (
                    <Card key={type}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center capitalize">
                          {getEquipmentIcon(type)}
                          <span className="ml-2">{type}s ({filterEquipmentByType(type).length})</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {filterEquipmentByType(type).map((item) => (
                          <DraggableEquipmentCard
                            key={item.id}
                            equipment={item}
                            isSelected={selectedEquipment?.id === item.id}
                            onClick={() => setSelectedEquipment(item)}
                            onStatusChange={updateEquipmentStatus}
                          />
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex">
            {/* Central Mine Layout */}
            <div className="flex-1 p-6">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-orange-500" />
                    Mine Layout & Operations
                    <div className="ml-auto text-sm text-muted-foreground">
                      Live Updates Every 30s
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-full">
                  <div className="relative h-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden">
                    {/* Assignment Drop Zone */}
                    <div 
                      id="assignment-zone"
                      className="absolute top-4 right-4 w-48 h-16 border-2 border-dashed border-orange-500/50 rounded-lg flex items-center justify-center bg-orange-500/10 text-orange-300 text-sm"
                    >
                      Drop equipment here to assign
                    </div>
                    
                    {/* Mine Layout Visualization */}
                    <div className="absolute inset-4">
                      {/* Benches */}
                      <div className="absolute top-4 left-4 w-32 h-20 bg-amber-900/30 border border-amber-600/50 rounded flex items-center justify-center">
                        <span className="text-xs text-amber-300">Bench 1</span>
                      </div>
                      <div className="absolute top-4 left-40 w-32 h-20 bg-amber-900/30 border border-amber-600/50 rounded flex items-center justify-center">
                        <span className="text-xs text-amber-300">Bench 2</span>
                      </div>
                      
                      {/* Processing Plant */}
                      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-40 h-24 bg-blue-900/30 border border-blue-600/50 rounded flex items-center justify-center">
                        <span className="text-xs text-blue-300">Processing Plant</span>
                      </div>
                      
                      {/* Dump Yards */}
                      <div className="absolute top-4 right-4 w-32 h-16 bg-red-900/30 border border-red-600/50 rounded flex items-center justify-center">
                        <span className="text-xs text-red-300">Waste Dump A</span>
                      </div>
                      <div className="absolute bottom-4 right-4 w-32 h-16 bg-green-900/30 border border-green-600/50 rounded flex items-center justify-center">
                        <span className="text-xs text-green-300">Ore Stockpile</span>
                      </div>
                      
                      {/* Equipment Icons on Map */}
                      {equipment.filter(eq => eq.status === 'active').map((item, index) => (
                        <div
                          key={item.id}
                          className={`absolute w-6 h-6 rounded-full flex items-center justify-center text-white text-xs cursor-pointer hover:scale-110 transition-transform ${
                            item.type === 'excavator' ? 'bg-orange-500' :
                            item.type === 'dumper' ? 'bg-blue-500' :
                            item.type === 'crusher' ? 'bg-purple-500' :
                            'bg-green-500'
                          }`}
                          style={{
                            left: `${20 + (index * 30)}px`,
                            top: `${20 + (index * 25)}px`
                          }}
                          onClick={() => setSelectedEquipment(item)}
                        >
                          {getEquipmentIcon(item.type)}
                        </div>
                      ))}
                      
                      {/* Routes */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <defs>
                          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#4A90E2" />
                          </marker>
                        </defs>
                        <path
                          d="M 80 60 Q 200 100 300 200"
                          stroke="#4A90E2"
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray="5,5"
                          markerEnd="url(#arrowhead)"
                        />
                        <path
                          d="M 200 60 Q 300 120 400 180"
                          stroke="#4A90E2"
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray="5,5"
                          markerEnd="url(#arrowhead)"
                        />
                      </svg>
                    </div>
                    
                    {/* Legend */}
                    <div className="absolute bottom-4 left-4 bg-black/50 rounded p-3 space-y-1">
                      <div className="text-xs font-medium text-white mb-2">Equipment Status</div>
                      <div className="flex items-center space-x-2 text-xs">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-green-300">Active</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-yellow-300">Idle</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-red-300">Maintenance</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar - Equipment Details */}
            <div className="w-80 border-l border-border bg-card/30 overflow-y-auto">
              <div className="p-4">
                {selectedEquipment ? (
                  <EquipmentDetailsPanel 
                    equipment={selectedEquipment}
                    onStatusChange={updateEquipmentStatus}
                    onCreateAssignment={() => setIsCreateAssignmentOpen(true)}
                  />
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-medium mb-2">Select Equipment</h3>
                      <p className="text-sm text-muted-foreground">
                        Click on any equipment from the list or map to view details and manage assignments.
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                {/* Production Metrics */}
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Production Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-400">
                          {Math.round(productionMetrics.tonsPerHour).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Tons/Hour</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-400">
                          {Math.round(productionMetrics.dailyTotal).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Daily Total</div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Daily Target</span>
                        <span>{Math.round(productionMetrics.targetPercentage)}%</span>
                      </div>
                      <Progress value={productionMetrics.targetPercentage} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Equipment Utilization</span>
                        <span>{Math.round(productionMetrics.equipmentUtilization)}%</span>
                      </div>
                      <Progress value={productionMetrics.equipmentUtilization} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        )}

        <DragOverlay>
          {draggedItem && (
            <div className="equipment-card bg-card border border-orange-500 shadow-lg">
              <div className="flex items-center space-x-2">
                {getEquipmentIcon(draggedItem.type)}
                <span className="font-medium text-sm">{draggedItem.name}</span>
              </div>
            </div>
          )}
        </DragOverlay>
        {/* Maintenance View */}
        {activeView === 'maintenance' && (
          <div className="p-6">
            <MaintenanceScheduler 
              equipment={equipment}
              onEquipmentUpdate={loadEquipment}
            />
          </div>
        )}

        {/* Route Optimizer View */}
        {activeView === 'routes' && (
          <div className="p-6">
            <RouteOptimizer 
              equipment={equipment}
              onRouteUpdate={loadEquipment}
            />
          </div>
        )}

        {/* Analytics View */}
        {activeView === 'analytics' && (
          <div className="p-6">
            <AnalyticsDashboard 
              equipment={equipment}
              assignments={assignments}
            />
          </div>
        )}

        <Toaster />
      </div>
    </DndContext>
  )
}

// Draggable Equipment Card Component
function DraggableEquipmentCard({ 
  equipment, 
  isSelected, 
  onClick, 
  onStatusChange 
}: {
  equipment: Equipment
  isSelected: boolean
  onClick: () => void
  onStatusChange: (id: string, status: Equipment['status']) => void
}) {
  const getEquipmentIcon = (type: string) => {
    switch (type) {
      case 'excavator': return <Pickaxe className="h-4 w-4" />
      case 'dumper': return <Truck className="h-4 w-4" />
      case 'crusher': return <Factory className="h-4 w-4" />
      case 'dumpyard': return <MapPin className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'status-active'
      case 'idle': return 'status-idle'
      case 'maintenance': return 'status-maintenance'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3" />
      case 'idle': return <Clock className="h-3 w-3" />
      case 'maintenance': return <XCircle className="h-3 w-3" />
      default: return <AlertTriangle className="h-3 w-3" />
    }
  }

  return (
    <div
      className={`equipment-card ${isSelected ? 'ring-2 ring-orange-500' : ''}`}
      onClick={onClick}
      draggable={equipment.status === 'idle'}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', equipment.id)
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getEquipmentIcon(equipment.type)}
          <span className="font-medium text-sm">{equipment.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={`text-xs ${getStatusColor(equipment.status)}`}>
            {getStatusIcon(equipment.status)}
            <span className="ml-1">{equipment.status}</span>
          </Badge>
          {equipment.status !== 'maintenance' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                const newStatus = equipment.status === 'active' ? 'idle' : 'active'
                onStatusChange(equipment.id, newStatus)
              }}
            >
              {equipment.status === 'active' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
          )}
        </div>
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        {equipment.location} {equipment.operator && `• ${equipment.operator}`}
      </div>
      {equipment.efficiency !== undefined && (
        <div className="mt-2">
          <Progress value={equipment.efficiency} className="h-1" />
        </div>
      )}
    </div>
  )
}

// Equipment Details Panel Component
function EquipmentDetailsPanel({ 
  equipment, 
  onStatusChange, 
  onCreateAssignment 
}: {
  equipment: Equipment
  onStatusChange: (id: string, status: Equipment['status']) => void
  onCreateAssignment: () => void
}) {
  const getEquipmentIcon = (type: string) => {
    switch (type) {
      case 'excavator': return <Pickaxe className="h-4 w-4" />
      case 'dumper': return <Truck className="h-4 w-4" />
      case 'crusher': return <Factory className="h-4 w-4" />
      case 'dumpyard': return <MapPin className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'status-active'
      case 'idle': return 'status-idle'
      case 'maintenance': return 'status-maintenance'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3" />
      case 'idle': return <Clock className="h-3 w-3" />
      case 'maintenance': return <XCircle className="h-3 w-3" />
      default: return <AlertTriangle className="h-3 w-3" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {getEquipmentIcon(equipment.type)}
          <span className="ml-2">{equipment.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Status</div>
            <Badge className={getStatusColor(equipment.status)}>
              {getStatusIcon(equipment.status)}
              <span className="ml-1 capitalize">{equipment.status}</span>
            </Badge>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Location</div>
            <div className="font-medium">{equipment.location}</div>
          </div>
        </div>
        
        {equipment.operator && (
          <div>
            <div className="text-sm text-muted-foreground">Operator</div>
            <div className="font-medium">{equipment.operator}</div>
          </div>
        )}
        
        {equipment.capacity && (
          <div>
            <div className="text-sm text-muted-foreground">Capacity</div>
            <div className="font-medium">{equipment.capacity} {equipment.type === 'dumper' ? 'tons' : equipment.type === 'crusher' ? 'tph' : 'm³'}</div>
          </div>
        )}
        
        {equipment.currentLoad !== undefined && (
          <div>
            <div className="text-sm text-muted-foreground mb-1">Current Load</div>
            <Progress value={(equipment.currentLoad / (equipment.capacity || 1)) * 100} className="h-2" />
            <div className="text-xs text-muted-foreground mt-1">
              {equipment.currentLoad} / {equipment.capacity} {equipment.type === 'dumper' ? 'tons' : equipment.type === 'crusher' ? 'tph' : 'm³'}
            </div>
          </div>
        )}
        
        {equipment.efficiency !== undefined && (
          <div>
            <div className="text-sm text-muted-foreground mb-1">Efficiency</div>
            <Progress value={equipment.efficiency} className="h-2" />
            <div className="text-xs text-muted-foreground mt-1">{equipment.efficiency}%</div>
          </div>
        )}
        
        <div className="space-y-2">
          <Button className="w-full" variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Assign Operator
          </Button>
          <Button className="w-full" variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
          {equipment.status === 'idle' && (
            <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={onCreateAssignment}>
              <Activity className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          )}
          {equipment.status !== 'maintenance' && (
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => {
                const newStatus = equipment.status === 'active' ? 'idle' : 'active'
                onStatusChange(equipment.id, newStatus)
              }}
            >
              {equipment.status === 'active' ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Set to Idle
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Activate
                </>
              )}
            </Button>
          )}
          <Button 
            className="w-full" 
            variant="outline"
            onClick={() => onStatusChange(equipment.id, 'maintenance')}
          >
            <Wrench className="h-4 w-4 mr-2" />
            Send to Maintenance
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Create Assignment Dialog Component
function CreateAssignmentDialog({ 
  equipment, 
  onCreateAssignment, 
  selectedEquipment 
}: {
  equipment: Equipment[]
  onCreateAssignment: (assignment: Partial<Assignment>) => void
  selectedEquipment: Equipment | null
}) {
  const [formData, setFormData] = useState({
    excavatorId: selectedEquipment?.type === 'excavator' ? selectedEquipment.id : '',
    dumperId: selectedEquipment?.type === 'dumper' ? selectedEquipment.id : '',
    crusherId: '',
    dumpyardId: '',
    priority: 'medium' as Assignment['priority'],
    estimatedTime: 60
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreateAssignment(formData)
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create New Assignment</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="excavator">Excavator</Label>
          <Select value={formData.excavatorId} onValueChange={(value) => setFormData(prev => ({ ...prev, excavatorId: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select excavator" />
            </SelectTrigger>
            <SelectContent>
              {equipment.filter(eq => eq.type === 'excavator' && eq.status !== 'maintenance').map(eq => (
                <SelectItem key={eq.id} value={eq.id}>{eq.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="dumper">Dumper</Label>
          <Select value={formData.dumperId} onValueChange={(value) => setFormData(prev => ({ ...prev, dumperId: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select dumper" />
            </SelectTrigger>
            <SelectContent>
              {equipment.filter(eq => eq.type === 'dumper' && eq.status !== 'maintenance').map(eq => (
                <SelectItem key={eq.id} value={eq.id}>{eq.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="crusher">Crusher (Optional)</Label>
          <Select value={formData.crusherId} onValueChange={(value) => setFormData(prev => ({ ...prev, crusherId: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select crusher" />
            </SelectTrigger>
            <SelectContent>
              {equipment.filter(eq => eq.type === 'crusher').map(eq => (
                <SelectItem key={eq.id} value={eq.id}>{eq.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="dumpyard">Dump Yard</Label>
          <Select value={formData.dumpyardId} onValueChange={(value) => setFormData(prev => ({ ...prev, dumpyardId: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select dump yard" />
            </SelectTrigger>
            <SelectContent>
              {equipment.filter(eq => eq.type === 'dumpyard').map(eq => (
                <SelectItem key={eq.id} value={eq.id}>{eq.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as Assignment['priority'] }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="estimatedTime">Estimated Time (minutes)</Label>
          <Input
            type="number"
            value={formData.estimatedTime}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) }))}
            min="1"
            max="480"
          />
        </div>

        <Button type="submit" className="w-full" disabled={!formData.excavatorId || !formData.dumperId || !formData.dumpyardId}>
          Create Assignment
        </Button>
      </form>
    </DialogContent>
  )
}

export default App