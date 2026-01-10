import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { CreditOfficerPerformance } from '@/types/departmental';
import { User, Target, TrendingUp, AlertTriangle, Award, Users } from 'lucide-react';

interface CreditOfficerScorecardProps {
  officers: CreditOfficerPerformance[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(value);
}

function getPerformanceGrade(score: number): { grade: string; color: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  if (score >= 95) return { grade: 'A+', color: 'text-emerald-600', variant: 'default' };
  if (score >= 90) return { grade: 'A', color: 'text-emerald-600', variant: 'default' };
  if (score >= 85) return { grade: 'B+', color: 'text-blue-600', variant: 'secondary' };
  if (score >= 80) return { grade: 'B', color: 'text-blue-600', variant: 'secondary' };
  if (score >= 75) return { grade: 'C+', color: 'text-amber-600', variant: 'outline' };
  if (score >= 70) return { grade: 'C', color: 'text-amber-600', variant: 'outline' };
  return { grade: 'D', color: 'text-red-600', variant: 'destructive' };
}

function calculateOverallScore(officer: CreditOfficerPerformance): number {
  // Weighted score calculation
  const approvalWeight = 0.2;
  const targetWeight = 0.3;
  const qualityWeight = 0.3;
  const efficiencyWeight = 0.2;

  const approvalScore = Math.min(officer.approval_rate, 100);
  const targetScore = Math.min(officer.target_achievement, 100);
  const qualityScore = Math.max(0, 100 - (officer.par_30_rate * 8) - (officer.first_payment_default_rate * 5));
  const efficiencyScore = Math.max(0, 100 - (officer.avg_processing_time * 10));

  return (approvalScore * approvalWeight) +
         (targetScore * targetWeight) +
         (qualityScore * qualityWeight) +
         (efficiencyScore * efficiencyWeight);
}

export default function CreditOfficerScorecard({ officers }: CreditOfficerScorecardProps) {
  const officersWithScores = officers.map(o => ({
    ...o,
    overallScore: calculateOverallScore(o),
  })).sort((a, b) => b.overallScore - a.overallScore);

  const topPerformer = officersWithScores[0];
  const avgScore = officersWithScores.reduce((sum, o) => sum + o.overallScore, 0) / officersWithScores.length;

  // Prepare radar chart data for top performer comparison
  const radarData = [
    { metric: 'Approval Rate', value: topPerformer?.approval_rate || 0, fullMark: 100 },
    { metric: 'Target Achievement', value: topPerformer?.target_achievement || 0, fullMark: 100 },
    { metric: 'Portfolio Quality', value: Math.max(0, 100 - (topPerformer?.par_30_rate || 0) * 5), fullMark: 100 },
    { metric: 'Processing Speed', value: Math.max(0, 100 - (topPerformer?.avg_processing_time || 0) * 10), fullMark: 100 },
    { metric: 'Client Base', value: Math.min((topPerformer?.clients_managed || 0) / 1.5, 100), fullMark: 100 },
  ];

  // Prepare bar chart data
  const barData = officersWithScores.map(o => ({
    name: o.officer_name.split(' ')[0],
    score: Math.round(o.overallScore),
    target: o.target_achievement,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">Top Performer</p>
            </div>
            <p className="text-lg font-bold text-primary">{topPerformer?.officer_name}</p>
            <p className="text-sm text-muted-foreground">{topPerformer?.branch}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Team Average Score</p>
            </div>
            <p className="text-2xl font-bold">{avgScore.toFixed(1)}</p>
            <Badge variant={getPerformanceGrade(avgScore).variant}>{getPerformanceGrade(avgScore).grade}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Avg Target Achievement</p>
            </div>
            <p className="text-2xl font-bold">{(officersWithScores.reduce((sum, o) => sum + o.target_achievement, 0) / officersWithScores.length).toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Total Portfolio</p>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(officersWithScores.reduce((sum, o) => sum + o.portfolio_value, 0))}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rankings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="rankings" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Officer Score Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance Scores</CardTitle>
                <CardDescription>Overall weighted score by officer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          `${value}${name === 'score' ? ' pts' : '%'}`,
                          name === 'score' ? 'Overall Score' : 'Target Achievement'
                        ]}
                        contentStyle={{ borderRadius: '8px' }}
                      />
                      <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="score" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Performer Radar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  Top Performer Profile
                </CardTitle>
                <CardDescription>{topPerformer?.officer_name} - {topPerformer?.branch}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar
                        name="Performance"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rankings Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Officer Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>Officer</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">Grade</TableHead>
                    <TableHead className="text-right">Target %</TableHead>
                    <TableHead className="text-right">PAR 30</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {officersWithScores.map((officer, idx) => {
                    const grade = getPerformanceGrade(officer.overallScore);
                    return (
                      <TableRow key={officer.officer_id}>
                        <TableCell>
                          {idx === 0 ? (
                            <Badge className="bg-amber-500">🥇</Badge>
                          ) : idx === 1 ? (
                            <Badge variant="secondary">🥈</Badge>
                          ) : idx === 2 ? (
                            <Badge variant="outline">🥉</Badge>
                          ) : (
                            <span className="text-muted-foreground">{idx + 1}</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{officer.officer_name}</TableCell>
                        <TableCell>{officer.branch}</TableCell>
                        <TableCell className="text-right font-bold">{officer.overallScore.toFixed(1)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={grade.variant}>{grade.grade}</Badge>
                        </TableCell>
                        <TableCell className={`text-right ${officer.target_achievement >= 100 ? 'text-emerald-600' : officer.target_achievement >= 80 ? 'text-amber-600' : 'text-red-500'}`}>
                          {officer.target_achievement.toFixed(1)}%
                        </TableCell>
                        <TableCell className={`text-right ${officer.par_30_rate > 5 ? 'text-red-500' : ''}`}>
                          {officer.par_30_rate.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {officersWithScores.map((officer) => {
              const grade = getPerformanceGrade(officer.overallScore);
              return (
                <Card key={officer.officer_id} className="relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-16 h-16 ${grade.color === 'text-emerald-600' ? 'bg-emerald-500/10' : grade.color === 'text-blue-600' ? 'bg-blue-500/10' : grade.color === 'text-amber-600' ? 'bg-amber-500/10' : 'bg-red-500/10'} rounded-bl-full`} />
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{officer.officer_name}</CardTitle>
                          <CardDescription>{officer.branch}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={grade.variant} className="text-lg">{grade.grade}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Overall Score</span>
                        <span className="font-bold">{officer.overallScore.toFixed(1)}/100</span>
                      </div>
                      <Progress value={officer.overallScore} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Portfolio</p>
                        <p className="font-semibold">{formatCurrency(officer.portfolio_value)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Active Loans</p>
                        <p className="font-semibold">{officer.active_loans}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Approval Rate</p>
                        <p className="font-semibold">{officer.approval_rate.toFixed(1)}%</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Avg TAT</p>
                        <p className="font-semibold">{officer.avg_processing_time.toFixed(1)} days</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Target Achievement</span>
                        <span className={officer.target_achievement >= 100 ? 'text-emerald-600 font-bold' : 'font-medium'}>
                          {officer.target_achievement.toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(officer.target_achievement, 100)} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatCurrency(officer.disbursement_actual)}</span>
                        <span>Target: {formatCurrency(officer.disbursement_target)}</span>
                      </div>
                    </div>

                    {(officer.par_30_rate > 5 || officer.first_payment_default_rate > 3) && (
                      <div className="flex items-center gap-2 p-2 rounded bg-destructive/10 text-destructive text-xs">
                        <AlertTriangle className="h-3 w-3" />
                        <span>
                          {officer.par_30_rate > 5 && `High PAR (${officer.par_30_rate.toFixed(1)}%)`}
                          {officer.par_30_rate > 5 && officer.first_payment_default_rate > 3 && ' • '}
                          {officer.first_payment_default_rate > 3 && `High FPD (${officer.first_payment_default_rate.toFixed(1)}%)`}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Officer Performance Comparison</CardTitle>
              <CardDescription>Detailed metrics comparison across all credit officers</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Officer</TableHead>
                    <TableHead className="text-right">Clients</TableHead>
                    <TableHead className="text-right">Portfolio</TableHead>
                    <TableHead className="text-right">Apps Processed</TableHead>
                    <TableHead className="text-right">Approval %</TableHead>
                    <TableHead className="text-right">Avg TAT</TableHead>
                    <TableHead className="text-right">PAR 30</TableHead>
                    <TableHead className="text-right">FPD Rate</TableHead>
                    <TableHead className="text-right">Write-offs</TableHead>
                    <TableHead className="text-right">Target %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {officersWithScores.map((officer) => (
                    <TableRow key={officer.officer_id}>
                      <TableCell className="font-medium">{officer.officer_name}</TableCell>
                      <TableCell className="text-right">{officer.clients_managed}</TableCell>
                      <TableCell className="text-right">{formatCurrency(officer.portfolio_value)}</TableCell>
                      <TableCell className="text-right">{officer.applications_processed}</TableCell>
                      <TableCell className="text-right">{officer.approval_rate.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{officer.avg_processing_time.toFixed(1)}d</TableCell>
                      <TableCell className={`text-right ${officer.par_30_rate > 5 ? 'text-red-500 font-medium' : ''}`}>
                        {officer.par_30_rate.toFixed(1)}%
                      </TableCell>
                      <TableCell className={`text-right ${officer.first_payment_default_rate > 3 ? 'text-red-500 font-medium' : ''}`}>
                        {officer.first_payment_default_rate.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">{officer.write_off_rate.toFixed(2)}%</TableCell>
                      <TableCell className={`text-right font-medium ${officer.target_achievement >= 100 ? 'text-emerald-600' : officer.target_achievement >= 80 ? 'text-amber-600' : 'text-red-500'}`}>
                        {officer.target_achievement.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
