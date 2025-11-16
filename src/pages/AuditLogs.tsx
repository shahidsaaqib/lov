/* ==== AUDIT LOGS PAGE ==== */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { auditLogStorage, type AuditLog } from '@/lib/sync';
import { format } from 'date-fns';
import { Search, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = () => {
    const allLogs = auditLogStorage.getAll();
    setLogs(allLogs.reverse()); // Most recent first
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || log.entityType === filterType;

    return matchesSearch && matchesType;
  });

  const exportLogs = () => {
    if (filteredLogs.length === 0) {
      toast.error('No logs to export');
      return;
    }

    const csvContent = [
      'Timestamp,User,Action,Entity Type,Entity ID,Details',
      ...filteredLogs.map(log => 
        `"${format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}","${log.username}","${log.action}","${log.entityType}","${log.entityId}","${log.details.replace(/"/g, '""')}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Audit logs exported');
  };

  const clearLogs = () => {
    if (confirm('Are you sure you want to clear all audit logs? This cannot be undone.')) {
      auditLogStorage.clear();
      loadLogs();
      toast.success('Audit logs cleared');
    }
  };

  const getEntityTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'medicine': return 'bg-blue-500';
      case 'sale': return 'bg-green-500';
      case 'refund': return 'bg-red-500';
      case 'expense': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <div className="flex gap-2">
          <Button onClick={exportLogs} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={clearLogs} variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={filterType === 'medicine' ? 'default' : 'outline'}
                onClick={() => setFilterType('medicine')}
                size="sm"
              >
                Medicines
              </Button>
              <Button
                variant={filterType === 'sale' ? 'default' : 'outline'}
                onClick={() => setFilterType('sale')}
                size="sm"
              >
                Sales
              </Button>
              <Button
                variant={filterType === 'refund' ? 'default' : 'outline'}
                onClick={() => setFilterType('refund')}
                size="sm"
              >
                Refunds
              </Button>
              <Button
                variant={filterType === 'expense' ? 'default' : 'outline'}
                onClick={() => setFilterType('expense')}
                size="sm"
              >
                Expenses
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                      </TableCell>
                      <TableCell className="font-medium">{log.username}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>
                        <Badge className={getEntityTypeBadgeColor(log.entityType)}>
                          {log.entityType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-md truncate">
                        {log.details}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredLogs.length > 0 && (
            <div className="text-sm text-muted-foreground text-center">
              Showing {filteredLogs.length} of {logs.length} total logs
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogs;

/* ==== END OF AUDIT LOGS PAGE ==== */
