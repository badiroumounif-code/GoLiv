import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { formatDate, getUrgencyBadge, getStatusBadge, getStatusLabel } from "./adminUtils";

export default function DeliveryDetailsDialog({ open, onOpenChange, selectedItem }) {
  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Détails de la commande</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Client</p>
                  <p className="font-medium text-slate-900">{selectedItem.nom}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Téléphone</p>
                  <p className="font-medium text-slate-900">{selectedItem.telephone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Zone de récupération</p>
                  <p className="font-medium text-slate-900">{selectedItem.zone_enlevement}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Zone de livraison</p>
                  <p className="font-medium text-slate-900">{selectedItem.zone_livraison}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Type de colis</p>
                  <p className="font-medium text-slate-900">{selectedItem.type_colis}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Urgence</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyBadge(selectedItem.urgence)}`}>
                    {selectedItem.urgence}
                  </span>
                </div>
              </div>
              {selectedItem.livreur_nom && (
                <div>
                  <p className="text-sm text-slate-500">Livreur assigné</p>
                  <p className="font-medium text-slate-900">{selectedItem.livreur_nom}</p>
                </div>
              )}
              {selectedItem.notes && (
                <div>
                  <p className="text-sm text-slate-500">Notes</p>
                  <p className="text-slate-900">{selectedItem.notes}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Statut</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedItem.status)}`}>
                    {getStatusLabel(selectedItem.status)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Date de création</p>
                  <p className="font-medium text-slate-900">{formatDate(selectedItem.created_at)}</p>
                </div>
              </div>
              {selectedItem.assigned_at && (
                <div>
                  <p className="text-sm text-slate-500">Date d&apos;assignation</p>
                  <p className="font-medium text-slate-900">{formatDate(selectedItem.assigned_at)}</p>
                </div>
              )}
              {selectedItem.completed_at && (
                <div>
                  <p className="text-sm text-slate-500">Date de livraison</p>
                  <p className="font-medium text-slate-900">{formatDate(selectedItem.completed_at)}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
  );
}
