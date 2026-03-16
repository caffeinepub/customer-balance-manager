import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface WhatsAppMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMessage: string;
  onConfirm: (editedMessage: string) => void;
}

export default function WhatsAppMessageDialog({
  open,
  onOpenChange,
  defaultMessage,
  onConfirm,
}: WhatsAppMessageDialogProps) {
  const [message, setMessage] = useState(defaultMessage);

  const handleConfirm = () => {
    onConfirm(message);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  // Reset message when dialog opens with new default
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setMessage(defaultMessage);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit WhatsApp Message</DialogTitle>
          <DialogDescription>
            Review and edit the message before sending it via WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="resize-none font-sans"
              placeholder="Enter your message..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!message.trim()}>
            Send via WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
