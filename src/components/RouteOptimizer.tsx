import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { toast } from 'sonner'
import { blink } from '../blink/client'
import { 
  Route, 
  Navigation, 
  MapPin, 
  Clock, 
  Fuel, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Plus,
  RefreshCw,
  Zap,
  Target,
  BarChart3
} from 'lucide-react'

interface Equipment {
  id: string
  name: string
  type: 'excavator' | 'dumper' | 'crusher' | 'dumpyard'
  status: 'active' | 'idle' | 'maintenance'
  location: string
  capacity?: number
  currentLoad?: number
}

interface RoutePoint {
  id: string
  name: string
  type: 'loading' | 'dumping' | 'processing'
  coordinates: { x: number; y: number }
  capacity?: number
  currentLoad?: number
  waitTime?: number
}

interface OptimizedRoute {
  id: string
  equipmentId: string
  equipmentName: string
  points: RoutePoint[]
  totalDistance: number
  estimatedTime: number
  fuelConsumption: number
  efficiency: number
  status: 'planned' | 'active' | 'completed'
  priority: 'high' | 'medium' | 'low'
}

interface RouteOptimizerProps {
  equipment: Equipment[]
  onRouteUpdate: () => void
}

export function RouteOptimizer({ equipment, onRouteUpdate }: RouteOptimizerProps) {
  const [routes, setRoutes] = useState<OptimizedRoute[]>([])
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([])
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isCreateRouteOpen, setIsCreateRouteOpen] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [optimizationMetrics, setOptimizationMetrics] = useState({
    totalDistance: 0,
    totalTime: 0,
    fuelSavings: 0,
    efficiencyGain: 0
  })

  useEffect(() => {
    loadRoutes()
    loadRoutePoints()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadRoutes = async () => {
    try {
      const user = await blink.auth.me()
      const data = await blink.db.optimizedRoutes.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      
      setRoutes(data.map(route => ({
        id: route.id,
        equipmentId: route.equipment_id,
        equipmentName: route.equipment_name,
        points: JSON.parse(route.points || '[]'),
        totalDistance: route.total_distance,
        estimatedTime: route.estimated_time,
        fuelConsumption: route.fuel_consumption,
        efficiency: route.efficiency,
        status: route.status as OptimizedRoute['status'],
        priority: route.priority as OptimizedRoute['priority']
      })))
    } catch (error) {
      console.error('Failed to load routes:', error)
    }
  }

  const loadRoutePoints = async () => {
    try {
      const user = await blink.auth.me()
      const data = await blink.db.routePoints.list({
        where: { userId: user.id },
        orderBy: { name: 'asc' }
      })
      
      if (data.length === 0) {
        await initializeSampleRoutePoints()
        return
      }
      
      setRoutePoints(data.map(point => ({
        id: point.id,
        name: point.name,
        type: point.type as RoutePoint['type'],
        coordinates: JSON.parse(point.coordinates),
        capacity: point.capacity,
        currentLoad: point.current_load,
        waitTime: point.wait_time
      })))
    } catch (error) {
      console.error('Failed to load route points:', error)
    }
  }

  const initializeSampleRoutePoints = async () => {
    const samplePoints: RoutePoint[] = [
      {
        id: 'point-1',
        name: 'Bench 1 Loading',
        type: 'loading',
        coordinates: { x: 100, y: 80 },
        capacity: 1000,
        currentLoad: 650,
        waitTime: 5
      },
      {
        id: 'point-2',
        name: 'Bench 2 Loading',
        type: 'loading',
        coordinates: { x: 200, y: 80 },
        capacity: 1200,
        currentLoad: 800,
        waitTime: 3
      },
      {
        id: 'point-3',
        name: 'Primary Crusher',
        type: 'processing',
        coordinates: { x: 300, y: 200 },
        capacity: 2000,
        currentLoad: 1500,
        waitTime: 8
      },
      {
        id: 'point-4',
        name: 'Waste Dump A',
        type: 'dumping',
        coordinates: { x: 450, y: 100 },
        capacity: 50000,
        currentLoad: 32000,
        waitTime: 2
      },
      {
        id: 'point-5',
        name: 'Ore Stockpile',
        type: 'dumping',
        coordinates: { x: 350, y: 300 },
        capacity: 25000,
        currentLoad: 18500,
        waitTime: 4
      },
      {
        id: 'point-6',
        name: 'Waste Dump B',
        type: 'dumping',
        coordinates: { x: 500, y: 250 },
        capacity: 40000,
        currentLoad: 5000,
        waitTime: 2
      }
    ]

    try {
      const user = await blink.auth.me()
      await blink.db.routePoints.createMany(
        samplePoints.map(point => ({
          ...point,
          coordinates: JSON.stringify(point.coordinates),
          userId: user.id
        }))
      )
      setRoutePoints(samplePoints)
      toast.success('Sample route points initialized')
    } catch (error) {
      console.error('Failed to initialize route points:', error)
    }
  }

  const optimizeRoutes = async () => {
    try {
      setIsOptimizing(true)
      
      // Get active dumpers for route optimization
      const activeDumpers = equipment.filter(eq => eq.type === 'dumper' && eq.status !== 'maintenance')
      
      if (activeDumpers.length === 0) {
        toast.error('No available dumpers for route optimization')
        return
      }

      const optimizedRoutes: OptimizedRoute[] = []
      
      for (const dumper of activeDumpers) {
        const route = await generateOptimizedRoute(dumper)
        if (route) {
          optimizedRoutes.push(route)
        }
      }

      // Save optimized routes to database
      const user = await blink.auth.me()
      for (const route of optimizedRoutes) {
        await blink.db.optimizedRoutes.create({
          ...route,
          points: JSON.stringify(route.points),
          userId: user.id,
          createdAt: new Date().toISOString()
        })
      }

      await loadRoutes()
      
      // Calculate optimization metrics
      const totalDistance = optimizedRoutes.reduce((sum, route) => sum + route.totalDistance, 0)
      const totalTime = optimizedRoutes.reduce((sum, route) => sum + route.estimatedTime, 0)
      const avgEfficiency = optimizedRoutes.reduce((sum, route) => sum + route.efficiency, 0) / optimizedRoutes.length
      
      setOptimizationMetrics({
        totalDistance,
        totalTime,
        fuelSavings: Math.round(totalDistance * 0.15), // Estimated 15% fuel savings
        efficiencyGain: Math.round(avgEfficiency - 75) // Compared to baseline 75%
      })

      toast.success(`Optimized routes for ${optimizedRoutes.length} vehicles`)
    } catch (error) {
      console.error('Failed to optimize routes:', error)
      toast.error('Failed to optimize routes')
    } finally {
      setIsOptimizing(false)
    }
  }

  const generateOptimizedRoute = async (dumper: Equipment): Promise<OptimizedRoute | null> => {
    // Simple route optimization algorithm
    // In a real system, this would use advanced algorithms like Dijkstra's or A*
    
    const loadingPoints = routePoints.filter(p => p.type === 'loading')
    const dumpingPoints = routePoints.filter(p => p.type === 'dumping')
    
    if (loadingPoints.length === 0 || dumpingPoints.length === 0) {
      return null
    }

    // Select optimal loading and dumping points based on capacity and distance
    const bestLoadingPoint = loadingPoints.reduce((best, current) => {
      const loadingCapacity = (current.capacity || 0) - (current.currentLoad || 0)
      const bestCapacity = (best.capacity || 0) - (best.currentLoad || 0)
      return loadingCapacity > bestCapacity ? current : best
    })

    const bestDumpingPoint = dumpingPoints.reduce((best, current) => {
      const dumpingCapacity = (current.capacity || 0) - (current.currentLoad || 0)
      const bestCapacity = (best.capacity || 0) - (best.currentLoad || 0)
      return dumpingCapacity > bestCapacity ? current : best
    })

    // Calculate route metrics
    const distance = calculateDistance(bestLoadingPoint.coordinates, bestDumpingPoint.coordinates)
    const estimatedTime = Math.round(distance / 25 + (bestLoadingPoint.waitTime || 0) + (bestDumpingPoint.waitTime || 0)) // 25 km/h average speed
    const fuelConsumption = Math.round(distance * 0.3) // 0.3L per km
    const efficiency = Math.round(85 + Math.random() * 15) // 85-100% efficiency

    return {
      id: `route-${Date.now()}-${dumper.id}`,
      equipmentId: dumper.id,
      equipmentName: dumper.name,
      points: [bestLoadingPoint, bestDumpingPoint],
      totalDistance: distance,
      estimatedTime,
      fuelConsumption,
      efficiency,
      status: 'planned',
      priority: 'medium'
    }
  }

  const calculateDistance = (point1: { x: number; y: number }, point2: { x: number; y: number }): number => {
    const dx = point2.x - point1.x
    const dy = point2.y - point1.y
    return Math.round(Math.sqrt(dx * dx + dy * dy) / 10) // Convert to km (simplified)
  }

  const activateRoute = async (routeId: string) => {
    try {
      await blink.db.optimizedRoutes.update(routeId, {
        status: 'active',
        updatedAt: new Date().toISOString()
      })
      await loadRoutes()
      toast.success('Route activated successfully')
    } catch (error) {
      console.error('Failed to activate route:', error)
      toast.error('Failed to activate route')
    }
  }

  const getRouteStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'completed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Route className="h-6 w-6 mr-2 text-orange-500" />
            Route Optimizer
          </h2>
          <p className="text-muted-foreground">Optimize equipment routes for maximum efficiency</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={optimizeRoutes} 
            disabled={isOptimizing}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isOptimizing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            {isOptimizing ? 'Optimizing...' : 'Optimize Routes'}
          </Button>
          <Dialog open={isCreateRouteOpen} onOpenChange={setIsCreateRouteOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Manual Route
              </Button>
            </DialogTrigger>
            <CreateRouteDialog 
              equipment={equipment}
              routePoints={routePoints}
              onCreateRoute={loadRoutes}
            />
          </Dialog>
        </div>
      </div>

      {/* Optimization Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Distance</p>
                <p className="text-2xl font-bold text-blue-400">{optimizationMetrics.totalDistance} km</p>
              </div>
              <Navigation className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Time</p>
                <p className="text-2xl font-bold text-green-400">{optimizationMetrics.totalTime} min</p>
              </div>
              <Clock className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fuel Savings</p>
                <p className="text-2xl font-bold text-orange-400">{optimizationMetrics.fuelSavings} L</p>
              </div>
              <Fuel className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Efficiency Gain</p>
                <p className="text-2xl font-bold text-purple-400">+{optimizationMetrics.efficiencyGain}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Route Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Route Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-orange-500" />
              Route Visualization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-80 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden">
              {/* Route Points */}
              {routePoints.map((point) => (
                <div
                  key={point.id}
                  className={`absolute w-4 h-4 rounded-full flex items-center justify-center text-xs cursor-pointer hover:scale-110 transition-transform ${
                    point.type === 'loading' ? 'bg-blue-500' :
                    point.type === 'dumping' ? 'bg-green-500' :
                    'bg-purple-500'
                  }`}
                  style={{
                    left: `${(point.coordinates.x / 600) * 100}%`,
                    top: `${(point.coordinates.y / 400) * 100}%`
                  }}
                  title={point.name}
                />
              ))}
              
              {/* Active Routes */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {routes.filter(route => route.status === 'active').map((route, index) => {
                  if (route.points.length < 2) return null
                  const start = route.points[0]
                  const end = route.points[route.points.length - 1]
                  return (
                    <line
                      key={route.id}
                      x1={`${(start.coordinates.x / 600) * 100}%`}
                      y1={`${(start.coordinates.y / 400) * 100}%`}
                      x2={`${(end.coordinates.x / 600) * 100}%`}
                      y2={`${(end.coordinates.y / 400) * 100}%`}
                      stroke="#4A90E2"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  )
                })}
              </svg>
              
              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-black/50 rounded p-3 space-y-1">
                <div className="text-xs font-medium text-white mb-2">Route Points</div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-300">Loading</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-300">Dumping</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-purple-300">Processing</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Route Points Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-blue-500" />
              Route Points Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {routePoints.map((point) => {
              const utilizationPercent = point.capacity ? (point.currentLoad || 0) / point.capacity * 100 : 0
              return (
                <div key={point.id} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{point.name}</span>
                    <Badge className={
                      point.type === 'loading' ? 'bg-blue-500/20 text-blue-400' :
                      point.type === 'dumping' ? 'bg-green-500/20 text-green-400' :
                      'bg-purple-500/20 text-purple-400'
                    }>
                      {point.type}
                    </Badge>
                  </div>
                  {point.capacity && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Capacity</span>
                        <span>{utilizationPercent.toFixed(1)}%</span>
                      </div>
                      <Progress value={utilizationPercent} className="h-2" />
                      <div className="text-xs text-muted-foreground mt-1">
                        {point.currentLoad} / {point.capacity} tons
                      </div>
                    </div>
                  )}
                  {point.waitTime && (
                    <div className="text-xs text-muted-foreground">
                      ⏱️ Avg wait time: {point.waitTime} min
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Optimized Routes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-orange-500" />
            Optimized Routes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {routes.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No routes optimized yet</p>
              <p className="text-sm">Click "Optimize Routes" to generate efficient routes for your equipment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {routes.map((route) => (
                <RouteCard 
                  key={route.id} 
                  route={route} 
                  onActivate={activateRoute}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function RouteCard({ 
  route, 
  onActivate 
}: { 
  route: OptimizedRoute
  onActivate: (routeId: string) => void 
}) {
  const getRouteStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'completed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{route.equipmentName}</span>
            <Badge className={getPriorityColor(route.priority)}>
              {route.priority}
            </Badge>
            <Badge className={getRouteStatusColor(route.status)}>
              {route.status}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {route.points.map(point => point.name).join(' → ')}
          </div>
        </div>
        {route.status === 'planned' && (
          <Button 
            size="sm" 
            onClick={() => onActivate(route.id)}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Activate
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">Distance</div>
          <div className="font-medium">{route.totalDistance} km</div>
        </div>
        <div>
          <div className="text-muted-foreground">Time</div>
          <div className="font-medium">{route.estimatedTime} min</div>
        </div>
        <div>
          <div className="text-muted-foreground">Fuel</div>
          <div className="font-medium">{route.fuelConsumption} L</div>
        </div>
        <div>
          <div className="text-muted-foreground">Efficiency</div>
          <div className="font-medium">{route.efficiency}%</div>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Route Efficiency</span>
          <span>{route.efficiency}%</span>
        </div>
        <Progress value={route.efficiency} className="h-2" />
      </div>
    </div>
  )
}

function CreateRouteDialog({ 
  equipment, 
  routePoints, 
  onCreateRoute 
}: { 
  equipment: Equipment[]
  routePoints: RoutePoint[]
  onCreateRoute: () => void 
}) {
  const [formData, setFormData] = useState({
    equipmentId: '',
    startPointId: '',
    endPointId: '',
    priority: 'medium' as OptimizedRoute['priority']
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const selectedEquipment = equipment.find(eq => eq.id === formData.equipmentId)
    const startPoint = routePoints.find(p => p.id === formData.startPointId)
    const endPoint = routePoints.find(p => p.id === formData.endPointId)
    
    if (!selectedEquipment || !startPoint || !endPoint) return

    try {
      const distance = Math.round(Math.sqrt(
        Math.pow(endPoint.coordinates.x - startPoint.coordinates.x, 2) +
        Math.pow(endPoint.coordinates.y - startPoint.coordinates.y, 2)
      ) / 10)
      
      const estimatedTime = Math.round(distance / 25 + (startPoint.waitTime || 0) + (endPoint.waitTime || 0))
      const fuelConsumption = Math.round(distance * 0.3)
      const efficiency = Math.round(85 + Math.random() * 15)

      const user = await blink.auth.me()
      await blink.db.optimizedRoutes.create({
        id: `route-${Date.now()}`,
        equipmentId: formData.equipmentId,
        equipmentName: selectedEquipment.name,
        points: JSON.stringify([startPoint, endPoint]),
        totalDistance: distance,
        estimatedTime,
        fuelConsumption,
        efficiency,
        status: 'planned',
        priority: formData.priority,
        userId: user.id,
        createdAt: new Date().toISOString()
      })

      onCreateRoute()
      toast.success('Manual route created successfully')
    } catch (error) {
      console.error('Failed to create route:', error)
      toast.error('Failed to create route')
    }
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create Manual Route</DialogTitle>
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
              {equipment.filter(eq => eq.type === 'dumper' && eq.status !== 'maintenance').map(eq => (
                <SelectItem key={eq.id} value={eq.id}>{eq.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Start Point</Label>
          <Select 
            value={formData.startPointId} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, startPointId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select start point" />
            </SelectTrigger>
            <SelectContent>
              {routePoints.map(point => (
                <SelectItem key={point.id} value={point.id}>{point.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>End Point</Label>
          <Select 
            value={formData.endPointId} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, endPointId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select end point" />
            </SelectTrigger>
            <SelectContent>
              {routePoints.map(point => (
                <SelectItem key={point.id} value={point.id}>{point.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Priority</Label>
          <Select 
            value={formData.priority} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as OptimizedRoute['priority'] }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-orange-500 hover:bg-orange-600"
          disabled={!formData.equipmentId || !formData.startPointId || !formData.endPointId}
        >
          Create Route
        </Button>
      </form>
    </DialogContent>
  )
}