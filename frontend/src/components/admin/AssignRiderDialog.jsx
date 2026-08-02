import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export default function AssignRiderDialog({
  open,
  onOpenChange,
  selectedItem,
  acceptedRiders,
  selectedRiderId,
  setSelectedRiderId,
  actionLoading,
  handleAssignRider,
}) {
  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assigner un livreur</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-500 mb-1">Commande</p>
                <p className="font-medium text-slate-900">{selectedItem.nom}</p>
                <p className="text-sm text-slate-600">{selectedItem.zone_enlevement} → {selectedItem.zone_livraison}</p>
              </div>

              <div>
                <Label className="text-slate-700 mb-2 block">
                  Sélectionner un livreur *
                </Label>
                <Select value={selectedRiderId} onValueChange={setSelectedRiderId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Choisir un livreur" />
                  </SelectTrigger>
                  <SelectContent>
                    {acceptedRiders.length === 0 ? (
                      <div className="p-2 text-sm text-slate-500">Aucun livreur validé</div>
                    ) : (
                      acceptedRiders.map((rider) => (
                        <SelectItem key={rider.id} value={rider.id}>
                          {rider.prenom} {rider.nom} - {rider.zone_couverture} ({rider.livraisons_en_cours || 0} en cours)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
              Annuler
            </Button>
            <Button
              onClick={handleAssignRider}
              disabled={actionLoading || !selectedRiderId}
              className="bg-sky-500 hover:bg-sky-600 text-white rounded-full"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Assigner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
