import { useEffect, useState } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { format } from 'date-fns';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FeedbackForm } from './FeedbackForm';
import { supabase } from '@/lib/supabase';
import { FeedbackData } from '@/types/feedback';
import { toast } from 'sonner';

export function FeedbackList() {
  const [feedback, setFeedback] = useState<FeedbackData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackData | null>(null);
  const user = useUser();

  const fetchFeedback = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_feedback')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedback(data || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to load feedback history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFeedback();
    }
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_feedback')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFeedback((prev) => prev.filter((f) => f.id !== id));
      toast.success('Feedback deleted successfully');
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast.error('Failed to delete feedback');
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        Please sign in to view your feedback history.
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading feedback history...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Your Feedback History</h2>
      {feedback.length === 0 ? (
        <p className="text-muted-foreground">You haven't submitted any feedback yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feedback.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.created_at &&
                    format(new Date(item.created_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell className="capitalize">{item.category}</TableCell>
                <TableCell className="capitalize">{item.feedback_type}</TableCell>
                <TableCell>{item.rating}/5</TableCell>
                <TableCell className="max-w-[300px] truncate">
                  {item.message}
                </TableCell>
                <TableCell className="text-right">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFeedback(item)}
                      >
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Feedback</DialogTitle>
                      </DialogHeader>
                      <FeedbackForm
                        initialData={item}
                        onSuccess={() => {
                          fetchFeedback();
                          setSelectedFeedback(null);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => item.id && handleDelete(item.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
} 