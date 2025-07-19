import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Progress } from './components/ui/progress'
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
  Zap
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
}

function App() {
  const [equipment, setEquipment] = useState<Equipment[]>([
    // Excavators
    { id: 'exc-001', name: 'CAT 390F', type: 'excavator', status: 'active', location: 'Bench 1', operator: 'John Smith', capacity: 4.5, currentLoad: 3.8, efficiency: 85 },
    { id: 'exc-002', name: 'Komatsu PC800', type: 'excavator', status: 'idle', location: 'Bench 2', operator: 'Mike Johnson', capacity: 5.2, currentLoad: 0, efficiency: 92 },
    { id: 'exc-003', name: 'Hitachi EX1200', type: 'excavator', status: 'maintenance', location: 'Workshop', capacity: 6.0, efficiency: 0, lastMaintenance: '2024-01-15' },
    
    // Dumpers
    { id: 'dum-001', name: 'CAT 777G', type: 'dumper', status: 'active', location: 'Route A', operator: 'Sarah Wilson', capacity: 100, currentLoad: 85, efficiency: 88 },
    { id: 'dum-002', name: 'Komatsu HD785', type: 'dumper', status: 'active', location: 'Route B', operator: 'David Brown', capacity: 91, currentLoad: 91, efficiency: 95 },
    { id: 'dum-003', name: 'CAT 775G', type: 'dumper', status: 'idle', location: 'Parking', operator: 'Lisa Davis', capacity: 70, currentLoad: 0, efficiency: 90 },
    { id: 'dum-004', name: 'Volvo A60H', type: 'dumper', status: 'maintenance', location: 'Workshop', capacity: 55, efficiency: 0 },
    
    // Crushers
    { id: 'cru-001', name: 'Primary Crusher', type: 'crusher', status: 'active', location: 'Plant 1', capacity: 2000, currentLoad: 1650, efficiency: 82 },
    { id: 'cru-002', name: 'Secondary Crusher', type: 'crusher', status: 'active', location: 'Plant 1', capacity: 1500, currentLoad: 1200, efficiency: 80 },
    { id: 'cru-003', name: 'Tertiary Crusher', type: 'crusher', status: 'idle', location: 'Plant 2', capacity: 1000, currentLoad: 0, efficiency: 0 },
    
    // Dump Yards
    { id: 'yard-001', name: 'Waste Dump A', type: 'dumpyard', status: 'active', location: 'North Zone', capacity: 50000, currentLoad: 32000, efficiency: 64 },
    { id: 'yard-002', name: 'Ore Stockpile', type: 'dumpyard', status: 'active', location: 'Processing Area', capacity: 25000, currentLoad: 18500, efficiency: 74 },
    { id: 'yard-003', name: 'Waste Dump B', type: 'dumpyard', status: 'idle', location: 'South Zone', capacity: 40000, currentLoad: 5000, efficiency: 12 }
  ])

  const [assignments, setAssignments] = useState<Assignment[]>([
    { id: 'assign-001', excavatorId: 'exc-001', dumperId: 'dum-001', crusherId: 'cru-001', dumpyardId: 'yard-002', priority: 'high', estimatedTime: 45, progress: 65 },
    { id: 'assign-002', excavatorId: 'exc-002', dumperId: 'dum-002', dumpyardId: 'yard-001', priority: 'medium', estimatedTime: 60, progress: 30 }
  ])

  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

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

  const metrics = getFleetMetrics()

  return (
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
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Shift: Day | Operator: Admin
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
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
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {assignments.map((assignment) => {
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
                    })}
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
                        <div
                          key={item.id}
                          className={`equipment-card ${selectedEquipment?.id === item.id ? 'ring-2 ring-orange-500' : ''}`}
                          onClick={() => setSelectedEquipment(item)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getEquipmentIcon(item.type)}
                              <span className="font-medium text-sm">{item.name}</span>
                            </div>
                            <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                              {getStatusIcon(item.status)}
                              <span className="ml-1">{item.status}</span>
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.location} {item.operator && `• ${item.operator}`}
                          </div>
                          {item.efficiency !== undefined && (
                            <div className="mt-2">
                              <Progress value={item.efficiency} className="h-1" />
                            </div>
                          )}
                        </div>
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
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full">
                <div className="relative h-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden">
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
                          item.type === 'excavator' ? 'bg-orange-500 top-12 left-12' :
                          item.type === 'dumper' ? 'bg-blue-500 top-32 left-32' :
                          item.type === 'crusher' ? 'bg-purple-500 bottom-32 left-1/2' :
                          'bg-green-500 top-12 right-12'
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      {getEquipmentIcon(selectedEquipment.type)}
                      <span className="ml-2">{selectedEquipment.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Status</div>
                        <Badge className={getStatusColor(selectedEquipment.status)}>
                          {getStatusIcon(selectedEquipment.status)}
                          <span className="ml-1 capitalize">{selectedEquipment.status}</span>
                        </Badge>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Location</div>
                        <div className="font-medium">{selectedEquipment.location}</div>
                      </div>
                    </div>
                    
                    {selectedEquipment.operator && (
                      <div>
                        <div className="text-sm text-muted-foreground">Operator</div>
                        <div className="font-medium">{selectedEquipment.operator}</div>
                      </div>
                    )}
                    
                    {selectedEquipment.capacity && (
                      <div>
                        <div className="text-sm text-muted-foreground">Capacity</div>
                        <div className="font-medium">{selectedEquipment.capacity} {selectedEquipment.type === 'dumper' ? 'tons' : selectedEquipment.type === 'crusher' ? 'tph' : 'm³'}</div>
                      </div>
                    )}
                    
                    {selectedEquipment.currentLoad !== undefined && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Current Load</div>
                        <Progress value={(selectedEquipment.currentLoad / (selectedEquipment.capacity || 1)) * 100} className="h-2" />
                        <div className="text-xs text-muted-foreground mt-1">
                          {selectedEquipment.currentLoad} / {selectedEquipment.capacity} {selectedEquipment.type === 'dumper' ? 'tons' : selectedEquipment.type === 'crusher' ? 'tph' : 'm³'}
                        </div>
                      </div>
                    )}
                    
                    {selectedEquipment.efficiency !== undefined && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Efficiency</div>
                        <Progress value={selectedEquipment.efficiency} className="h-2" />
                        <div className="text-xs text-muted-foreground mt-1">{selectedEquipment.efficiency}%</div>
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
                      {selectedEquipment.status === 'idle' && (
                        <Button className="w-full bg-orange-500 hover:bg-orange-600">
                          <Activity className="h-4 w-4 mr-2" />
                          Create Assignment
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
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
                      <div className="text-xl font-bold text-green-400">2,450</div>
                      <div className="text-xs text-muted-foreground">Tons/Hour</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-400">18,200</div>
                      <div className="text-xs text-muted-foreground">Daily Total</div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Daily Target</span>
                      <span>76%</span>
                    </div>
                    <Progress value={76} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App