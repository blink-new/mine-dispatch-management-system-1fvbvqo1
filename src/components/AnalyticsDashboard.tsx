import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { toast } from 'sonner'
import { blink } from '../blink/client'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Activity, 
  Clock, 
  DollarSign,
  Fuel,
  Target,
  AlertTriangle,
  CheckCircle,
  Zap,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react'

interface Equipment {
  id: string
  name: string
  type: 'excavator' | 'dumper' | 'crusher' | 'dumpyard'
  status: 'active' | 'idle' | 'maintenance'
  efficiency?: number
  totalHours?: number
  maintenanceHours?: number
}

interface Assignment {
  id: string
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  priority: 'high' | 'medium' | 'low'
  estimatedTime: number
  progress: number
}

interface AnalyticsData {
  productionMetrics: {
    dailyProduction: number
    weeklyProduction: number
    monthlyProduction: number
    targetAchievement: number
    efficiency: number
  }
  equipmentMetrics: {
    utilization: number
    availability: number
    performance: number
    oee: number // Overall Equipment Effectiveness
  }
  costMetrics: {
    operationalCost: number
    maintenanceCost: number
    fuelCost: number
    costPerTon: number
  }
  trends: {
    productionTrend: number[]
    efficiencyTrend: number[]
    downtimeTrend: number[]
  }
}

interface AnalyticsDashboardProps {
  equipment: Equipment[]
  assignments: Assignment[]
}

export function AnalyticsDashboard({ equipment, assignments }: AnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState('7d')
  const [loading, setLoading] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState('production')

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange, equipment, assignments]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      
      // Calculate analytics from current data
      const analytics = calculateAnalytics()
      setAnalyticsData(analytics)
      
      // In a real system, you would fetch historical data from the database
      // await blink.db.analyticsData.list({ where: { timeRange } })
      
    } catch (error) {
      console.error('Failed to load analytics data:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const calculateAnalytics = (): AnalyticsData => {
    const totalEquipment = equipment.length
    const activeEquipment = equipment.filter(eq => eq.status === 'active').length
    const idleEquipment = equipment.filter(eq => eq.status === 'idle').length
    const maintenanceEquipment = equipment.filter(eq => eq.status === 'maintenance').length
    
    const avgEfficiency = equipment.reduce((acc, eq) => acc + (eq.efficiency || 0), 0) / totalEquipment
    const utilization = totalEquipment > 0 ? (activeEquipment / totalEquipment) * 100 : 0
    const availability = totalEquipment > 0 ? ((totalEquipment - maintenanceEquipment) / totalEquipment) * 100 : 0
    
    // Simulate production data
    const baseProduction = 2450
    const dailyProduction = baseProduction + (Math.random() - 0.5) * 200
    const weeklyProduction = dailyProduction * 7 * (0.8 + Math.random() * 0.4)
    const monthlyProduction = weeklyProduction * 4.3 * (0.9 + Math.random() * 0.2)
    
    // Generate trend data
    const productionTrend = Array.from({ length: 30 }, (_, i) => 
      baseProduction + Math.sin(i * 0.2) * 300 + (Math.random() - 0.5) * 200
    )
    
    const efficiencyTrend = Array.from({ length: 30 }, (_, i) => 
      75 + Math.sin(i * 0.15) * 15 + (Math.random() - 0.5) * 10
    )
    
    const downtimeTrend = Array.from({ length: 30 }, (_, i) => 
      5 + Math.sin(i * 0.1) * 3 + Math.random() * 2
    )

    return {
      productionMetrics: {
        dailyProduction: Math.round(dailyProduction),
        weeklyProduction: Math.round(weeklyProduction),
        monthlyProduction: Math.round(monthlyProduction),
        targetAchievement: Math.min(100, (dailyProduction / 3000) * 100),
        efficiency: avgEfficiency
      },
      equipmentMetrics: {
        utilization,
        availability,
        performance: avgEfficiency,
        oee: (utilization * availability * avgEfficiency) / 10000
      },
      costMetrics: {
        operationalCost: Math.round(dailyProduction * 12.5),
        maintenanceCost: Math.round(totalEquipment * 850),
        fuelCost: Math.round(activeEquipment * 1200),
        costPerTon: Math.round((dailyProduction * 12.5) / dailyProduction * 100) / 100
      },
      trends: {
        productionTrend,
        efficiencyTrend,
        downtimeTrend
      }
    }
  }

  const exportReport = async () => {
    try {
      const reportData = {
        timestamp: new Date().toISOString(),
        timeRange,
        analytics: analyticsData,
        equipment: equipment.length,
        assignments: assignments.length
      }
      
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mine-analytics-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Analytics report exported successfully')
    } catch (error) {
      console.error('Failed to export report:', error)
      toast.error('Failed to export report')
    }
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <BarChart3 className="h-6 w-6 mr-2 text-orange-500" />
            Analytics Dashboard
          </h2>
          <p className="text-muted-foreground">Performance insights and operational metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadAnalyticsData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Daily Production"
          value={`${analyticsData.productionMetrics.dailyProduction.toLocaleString()} tons`}
          change={12.5}
          icon={<Target className="h-5 w-5" />}
          color="text-green-400"
        />
        <MetricCard
          title="Fleet Efficiency"
          value={`${analyticsData.productionMetrics.efficiency.toFixed(1)}%`}
          change={-2.1}
          icon={<Zap className="h-5 w-5" />}
          color="text-blue-400"
        />
        <MetricCard
          title="Equipment Utilization"
          value={`${analyticsData.equipmentMetrics.utilization.toFixed(1)}%`}
          change={5.3}
          icon={<Activity className="h-5 w-5" />}
          color="text-orange-400"
        />
        <MetricCard
          title="Cost per Ton"
          value={`$${analyticsData.costMetrics.costPerTon}`}
          change={-1.8}
          icon={<DollarSign className="h-5 w-5" />}
          color="text-purple-400"
        />
      </div>

      {/* Detailed Analytics */}
      <Tabs value={selectedMetric} onValueChange={setSelectedMetric}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="production" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Production Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {analyticsData.productionMetrics.dailyProduction.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Daily (tons)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {analyticsData.productionMetrics.weeklyProduction.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Weekly (tons)</div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Daily Target Achievement</span>
                    <span>{analyticsData.productionMetrics.targetAchievement.toFixed(1)}%</span>
                  </div>
                  <Progress value={analyticsData.productionMetrics.targetAchievement} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Production by Equipment Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['excavator', 'dumper', 'crusher'].map((type) => {
                    const count = equipment.filter(eq => eq.type === type).length
                    const activeCount = equipment.filter(eq => eq.type === type && eq.status === 'active').length
                    const contribution = count > 0 ? (activeCount / count) * 100 : 0
                    
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{type}s ({activeCount}/{count})</span>
                          <span>{contribution.toFixed(1)}%</span>
                        </div>
                        <Progress value={contribution} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="equipment" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>OEE Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Availability</span>
                      <span>{analyticsData.equipmentMetrics.availability.toFixed(1)}%</span>
                    </div>
                    <Progress value={analyticsData.equipmentMetrics.availability} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Performance</span>
                      <span>{analyticsData.equipmentMetrics.performance.toFixed(1)}%</span>
                    </div>
                    <Progress value={analyticsData.equipmentMetrics.performance} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Utilization</span>
                      <span>{analyticsData.equipmentMetrics.utilization.toFixed(1)}%</span>
                    </div>
                    <Progress value={analyticsData.equipmentMetrics.utilization} className="h-2" />
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">
                        {analyticsData.equipmentMetrics.oee.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Overall Equipment Effectiveness</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Equipment Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {equipment.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <span className="text-sm">{item.name}</span>
                      <Badge className={
                        item.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        item.status === 'idle' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }>
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {equipment
                    .filter(eq => eq.efficiency !== undefined)
                    .sort((a, b) => (b.efficiency || 0) - (a.efficiency || 0))
                    .slice(0, 5)
                    .map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold w-4">#{index + 1}</span>
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium">{item.efficiency}%</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-400">
                      ${analyticsData.costMetrics.operationalCost.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Operational</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-orange-400">
                      ${analyticsData.costMetrics.maintenanceCost.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Maintenance</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-400">
                    ${analyticsData.costMetrics.fuelCost.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Fuel</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Efficiency</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">
                    ${analyticsData.costMetrics.costPerTon}
                  </div>
                  <div className="text-sm text-muted-foreground">Cost per Ton</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Industry Average</span>
                    <span>$15.20</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Your Performance</span>
                    <span className={analyticsData.costMetrics.costPerTon < 15.20 ? 'text-green-400' : 'text-red-400'}>
                      {analyticsData.costMetrics.costPerTon < 15.20 ? '↓' : '↑'} ${analyticsData.costMetrics.costPerTon}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Production Trend</h4>
                    <div className="h-16 bg-gradient-to-r from-green-500/20 to-green-400/20 rounded flex items-end justify-between px-2">
                      {analyticsData.trends.productionTrend.slice(-7).map((value, index) => (
                        <div 
                          key={index}
                          className="bg-green-400 w-2 rounded-t"
                          style={{ height: `${(value / Math.max(...analyticsData.trends.productionTrend)) * 100}%` }}
                        />
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Avg: {(analyticsData.trends.productionTrend.reduce((a, b) => a + b, 0) / analyticsData.trends.productionTrend.length).toFixed(0)} tons/day
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Efficiency Trend</h4>
                    <div className="h-16 bg-gradient-to-r from-blue-500/20 to-blue-400/20 rounded flex items-end justify-between px-2">
                      {analyticsData.trends.efficiencyTrend.slice(-7).map((value, index) => (
                        <div 
                          key={index}
                          className="bg-blue-400 w-2 rounded-t"
                          style={{ height: `${value}%` }}
                        />
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Avg: {(analyticsData.trends.efficiencyTrend.reduce((a, b) => a + b, 0) / analyticsData.trends.efficiencyTrend.length).toFixed(1)}%
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Downtime Trend</h4>
                    <div className="h-16 bg-gradient-to-r from-red-500/20 to-red-400/20 rounded flex items-end justify-between px-2">
                      {analyticsData.trends.downtimeTrend.slice(-7).map((value, index) => (
                        <div 
                          key={index}
                          className="bg-red-400 w-2 rounded-t"
                          style={{ height: `${value * 10}%` }}
                        />
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Avg: {(analyticsData.trends.downtimeTrend.reduce((a, b) => a + b, 0) / analyticsData.trends.downtimeTrend.length).toFixed(1)} hours/day
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MetricCard({ 
  title, 
  value, 
  change, 
  icon, 
  color 
}: { 
  title: string
  value: string
  change: number
  icon: React.ReactNode
  color: string 
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <div className="flex items-center mt-1">
              {change > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-400 mr-1" />
              )}
              <span className={`text-xs ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {Math.abs(change)}%
              </span>
            </div>
          </div>
          <div className={color}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}