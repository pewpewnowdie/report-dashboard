"use client";

import { useState } from "react";
import { JMeterReport } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  Download,
  Users,
  Clock,
  Zap,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  Search,
  FileText,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface JMeterReportViewProps {
  reports: JMeterReport[];
}

export function JMeterReportView({ reports }: JMeterReportViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRuns, setExpandedRuns] = useState<Set<string>>(new Set());
  const [generatingReports, setGeneratingReports] = useState<Set<string>>(new Set());
  const [generatedReports, setGeneratedReports] = useState<Map<string, string>>(new Map());

  const toggleRunExpansion = (runId: string) => {
    const newExpanded = new Set(expandedRuns);
    if (newExpanded.has(runId)) {
      newExpanded.delete(runId);
    } else {
      newExpanded.add(runId);
    }
    setExpandedRuns(newExpanded);
  };

  const handleGenerateReport = async (runId: string) => {
    setGeneratingReports(prev => new Set(prev).add(runId));
    
    try {
      // Mock API call - replace with actual endpoint when ready
      // const response = await fetch(`/api/jmeter/generate-html-report/${runId}`, {
      //   method: 'POST',
      // });
      // const data = await response.json();
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock report URL - in real implementation, get this from API response
      const reportUrl = `https://example.com/reports/jmeter/${runId}.html`;
      
      setGeneratedReports(prev => new Map(prev).set(runId, reportUrl));
    } catch (error) {
      console.error('[v0] Failed to generate report:', error);
    } finally {
      setGeneratingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(runId);
        return newSet;
      });
    }
  };

  const handleDownloadReport = (runId: string) => {
    const reportUrl = generatedReports.get(runId);
    if (reportUrl) {
      // In real implementation, this would download the report file
      window.open(reportUrl, '_blank');
    }
  };

  const handleOpenReport = (runId: string) => {
    const reportUrl = generatedReports.get(runId);
    if (reportUrl) {
      window.open(reportUrl, '_blank');
    }
  };

  const filteredReports = reports.filter(
    (report) =>
      report.run_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.script_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.started_by.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!reports || reports.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No JMeter reports available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search runs by name, script, or author..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-background border-border"
        />
      </div>

      {filteredReports.length === 0 ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-muted-foreground">No runs match your search</p>
        </div>
      ) : (
        filteredReports.map((report) => {
          const isExpanded = expandedRuns.has(report.run_id);

          return (
            <Card key={report.run_id} className="overflow-hidden border-border bg-card">
              <button
                onClick={() => toggleRunExpansion(report.run_id)}
                className="w-full p-6 flex items-start justify-between hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                  )}
                  <div className="text-left flex-1">
                    <h3 className="text-xl font-semibold text-foreground">{report.run_name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Script: <span className="font-mono text-primary">{report.script_name}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <Badge
                    variant={report.run_status === "success" ? "default" : "destructive"}
                    className="mb-2"
                  >
                    {report.run_status === "success" ? "Success" : "Failed"}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {new Date(report.ended_at).toLocaleString()}
                  </p>
                </div>
              </button>

              {isExpanded && (
                <div className="px-6 pb-6 space-y-6 border-t border-border pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Avg Response Time</p>
                          <p className="text-2xl font-bold text-foreground">
                            {report.avg_response_time}
                            <span className="text-sm text-muted-foreground ml-1">ms</span>
                          </p>
                        </div>
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-chart-2/10 border border-chart-2/30">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Throughput</p>
                          <p className="text-2xl font-bold text-foreground">
                            {report.throughput.toFixed(1)}
                            <span className="text-sm text-muted-foreground ml-1">/sec</span>
                          </p>
                        </div>
                        <Zap className="w-5 h-5 text-chart-2" />
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Error Rate</p>
                          <p className="text-2xl font-bold text-foreground">
                            {report.error_rate.toFixed(2)}
                            <span className="text-sm text-muted-foreground ml-1">%</span>
                          </p>
                        </div>
                        <TrendingDown className="w-5 h-5 text-destructive" />
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-chart-3/10 border border-chart-3/30">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Virtual Users</p>
                          <p className="text-2xl font-bold text-foreground">{report.v_users}</p>
                        </div>
                        <Users className="w-5 h-5 text-chart-3" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Test Details</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Duration</p>
                        <p className="font-medium text-foreground">
                          {Math.floor(report.duration / 60)}m {report.duration % 60}s
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Started By</p>
                        <p className="font-medium text-foreground truncate">{report.started_by}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Release</p>
                        <p className="font-medium text-foreground">{report.release}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Project Key</p>
                        <p className="font-mono font-medium text-primary">{report.project_key}</p>
                      </div>
                    </div>
                  </div>

                  {/* HTML Report Generation */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">HTML Report</h4>
                    {!generatedReports.has(report.run_id) ? (
                      <Button
                        onClick={() => handleGenerateReport(report.run_id)}
                        disabled={generatingReports.has(report.run_id)}
                        className="w-full sm:w-auto"
                      >
                        {generatingReports.has(report.run_id) ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating Report...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-2" />
                            Generate HTML Report
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => handleDownloadReport(report.run_id)}
                          variant="default"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Report
                        </Button>
                        <Button
                          onClick={() => handleOpenReport(report.run_id)}
                          variant="outline"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Report
                        </Button>
                      </div>
                    )}
                  </div>

                  {report.files && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-3">Test Files</h4>
                      <div className="space-y-2">
                        {report.files.jmx && (
                          <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {report.files.jmx.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Uploaded: {new Date(report.files.jmx.uploadedAt).toLocaleString()}
                              </p>
                            </div>
                            <button className="p-2 hover:bg-accent rounded transition-colors">
                              <Download className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
                        )}
                        {report.files.jtl && (
                          <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {report.files.jtl.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Uploaded: {new Date(report.files.jtl.uploadedAt).toLocaleString()}
                              </p>
                            </div>
                            <button className="p-2 hover:bg-accent rounded transition-colors">
                              <Download className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
                        )}
                        {report.files.log && (
                          <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {report.files.log.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Uploaded: {new Date(report.files.log.uploadedAt).toLocaleString()}
                              </p>
                            </div>
                            <button className="p-2 hover:bg-accent rounded transition-colors">
                              <Download className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
