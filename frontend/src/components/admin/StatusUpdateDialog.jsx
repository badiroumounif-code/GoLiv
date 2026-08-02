import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";

export default function StatusUpdateDialog({
  open,
  onOpenChange,
  selectedItem,
  statusType,
  selectedStatus,
  statusReason,
  setStatusReason,
  actionLoading,
  handleStatusUpdate,
}) {
  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedStatus === 'accepte' ? 'Accepter la candidature' : 'Refuser la candidature'}
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-500 mb-1">Candidat</p>
                <p className="font-medium text-slate-900">
                  {statusType === 'merchant' ? selectedItem.nom_entreprise : `${selectedItem.prenom} ${selectedItem.nom}`}
                </p>
                <p className="text-sm text-slate-600">
                  {statusType === 'merchant' ? selectedItem.email : selectedItem.email}
                </p>
              </div>

              <div className={`flex items-center gap-3 p-4 rounded-xl ${selectedStatus === 'accepte' ? 'bg-green-50' : 'bg-red-50'}`}>
                {selectedStatus === 'accepte' ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Accepter cette candidature</p>
                      <p className="text-sm text-green-600">Un email de confirmation sera envoyé</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    <div>
                      <p className="font-medium text-red-800">Refuser cette candidature</p>
                      <p className="text-sm text-red-600">Un email de notification sera envoyé</p>
                    </div>
                  </>
                )}
              </div>

              <div>
                <Label className="text-slate-700 mb-2 block">
                  Raison (optionnel)
                </Label>
                <Textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder={selectedStatus === 'accepte' ? "Message de bienvenue..." : "Motif du refus..."}
                  className="rounded-xl"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
              Annuler
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={actionLoading}
              className={`rounded-full ${selectedStatus === 'accepte' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {selectedStatus === 'accepte' ? 'Accepter' : 'Refuser'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
