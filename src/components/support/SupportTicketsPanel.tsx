import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { SupportTicket } from '../../types';
import { MessageSquare, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export function SupportTicketsPanel() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (status === 'resolved' || status === 'closed') {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', ticketId);

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'ticket_status_updated',
        entity_type: 'support_ticket',
        entity_id: ticketId,
        details: { status }
      });

      loadTickets();
      setSelectedTicket(null);
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <MessageSquare className="w-5 h-5 text-slate-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 flex items-center justify-center">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Support Tickets</h2>
            <p className="text-sm text-slate-600 mt-1">{tickets.length} total tickets</p>
          </div>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="p-12 text-center">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No support tickets</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="p-6 hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  {getStatusIcon(ticket.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900">{ticket.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2 mb-2">{ticket.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Created {new Date(ticket.created_at).toLocaleDateString()}</span>
                      {ticket.resolved_at && (
                        <span>Resolved {new Date(ticket.resolved_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                    <>
                      {ticket.status === 'open' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTicketStatus(ticket.id, 'in_progress');
                          }}
                          className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          Start
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateTicketStatus(ticket.id, 'resolved');
                        }}
                        className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                      >
                        Resolve
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">{selectedTicket.title}</h3>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                  {selectedTicket.priority} priority
                </span>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">Description</h4>
                <p className="text-slate-600">{selectedTicket.description}</p>
              </div>

              <div className="flex gap-4 text-sm text-slate-600">
                <div>
                  <span className="font-medium">Status:</span> {selectedTicket.status}
                </div>
                <div>
                  <span className="font-medium">Created:</span> {new Date(selectedTicket.created_at).toLocaleString()}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={() => {
                    updateTicketStatus(selectedTicket.id, 'in_progress');
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Mark In Progress
                </button>
                <button
                  onClick={() => {
                    updateTicketStatus(selectedTicket.id, 'resolved');
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Mark Resolved
                </button>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
