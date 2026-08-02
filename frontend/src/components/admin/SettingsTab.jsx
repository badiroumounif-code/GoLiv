import { motion } from "framer-motion";
import { Edit2, Loader2, MapPin, Percent, Plus, Save, Scale, Trash2, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";

export default function SettingsTab({
  showNewZoneForm,
  setShowNewZoneForm,
  newZone,
  setNewZone,
  handleCreateZone,
  settingsLoading,
  zones,
  editingZone,
  setEditingZone,
  handleSaveZone,
  handleDeleteZone,
  platformSettings,
  setPlatformSettings,
  handleSaveSettings,
}) {
  return (
            <div className="space-y-6">
              {/* Zones Management */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-sky-500" />
                    Gestion des Zones de Livraison
                  </h2>
                  <Button
                    onClick={() => setShowNewZoneForm(true)}
                    className="bg-sky-500 hover:bg-sky-600"
                    data-testid="add-zone-btn"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle Zone
                  </Button>
                </div>

                {/* New Zone Form */}
                {showNewZoneForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="bg-sky-50 rounded-xl p-4 mb-6"
                  >
                    <h3 className="font-medium text-slate-900 mb-4">Ajouter une zone</h3>
                    <div className="grid md:grid-cols-4 gap-4">
                      <Input
                        placeholder="Nom de la zone"
                        value={newZone.nom}
                        onChange={(e) => setNewZone({ ...newZone, nom: e.target.value })}
                        data-testid="new-zone-name"
                      />
                      <Input
                        type="number"
                        placeholder="Prix base (FCFA)"
                        value={newZone.prix_base}
                        onChange={(e) => setNewZone({ ...newZone, prix_base: e.target.value })}
                        data-testid="new-zone-price"
                      />
                      <Input
                        type="number"
                        placeholder="Paiement livreur (FCFA)"
                        value={newZone.paiement_livreur}
                        onChange={(e) => setNewZone({ ...newZone, paiement_livreur: e.target.value })}
                        data-testid="new-zone-rider-payment"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleCreateZone} disabled={settingsLoading} className="flex-1">
                          <Save className="w-4 h-4 mr-2" />
                          Créer
                        </Button>
                        <Button variant="outline" onClick={() => setShowNewZoneForm(false)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Zones Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium text-slate-600">Zone</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-600">Prix Base</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-600">Paiement Livreur</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-600">Marge</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-600">Statut</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {zones.map((zone) => (
                        <tr key={zone.id} className="hover:bg-slate-50">
                          {editingZone?.id === zone.id ? (
                            <>
                              <td className="p-3">
                                <Input
                                  value={editingZone.nom}
                                  onChange={(e) => setEditingZone({ ...editingZone, nom: e.target.value })}
                                  className="h-8"
                                />
                              </td>
                              <td className="p-3">
                                <Input
                                  type="number"
                                  value={editingZone.prix_base}
                                  onChange={(e) => setEditingZone({ ...editingZone, prix_base: e.target.value })}
                                  className="h-8 w-24"
                                />
                              </td>
                              <td className="p-3">
                                <Input
                                  type="number"
                                  value={editingZone.paiement_livreur}
                                  onChange={(e) => setEditingZone({ ...editingZone, paiement_livreur: e.target.value })}
                                  className="h-8 w-24"
                                />
                              </td>
                              <td className="p-3 text-green-600 font-medium">
                                {(parseInt(editingZone.prix_base) || 0) - (parseInt(editingZone.paiement_livreur) || 0)} FCFA
                              </td>
                              <td className="p-3">
                                <Switch
                                  checked={editingZone.is_active}
                                  onCheckedChange={(checked) => setEditingZone({ ...editingZone, is_active: checked })}
                                />
                              </td>
                              <td className="p-3">
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleSaveZone(editingZone)} disabled={settingsLoading}>
                                    <Save className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingZone(null)}>
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-3 font-medium text-slate-900">{zone.nom}</td>
                              <td className="p-3 text-slate-700">{zone.prix_base.toLocaleString()} FCFA</td>
                              <td className="p-3 text-slate-700">{zone.paiement_livreur.toLocaleString()} FCFA</td>
                              <td className="p-3 text-green-600 font-medium">
                                {(zone.prix_base - zone.paiement_livreur).toLocaleString()} FCFA
                              </td>
                              <td className="p-3">
                                <Badge className={zone.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}>
                                  {zone.is_active ? "Actif" : "Inactif"}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => setEditingZone({ ...zone })}>
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDeleteZone(zone.id)}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Weight & Commission Settings */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Weight Surcharge */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-6">
                    <Scale className="w-5 h-5 text-amber-500" />
                    Supplément Poids
                  </h2>
                  {platformSettings && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-slate-700">Seuil de poids (kg)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={platformSettings.poids_seuil}
                          onChange={(e) => setPlatformSettings({ ...platformSettings, poids_seuil: parseFloat(e.target.value) })}
                          className="mt-1"
                        />
                        <p className="text-xs text-slate-500 mt-1">Au-delà de ce poids, un supplément est appliqué</p>
                      </div>
                      <div>
                        <Label className="text-slate-700">Supplément (FCFA)</Label>
                        <Input
                          type="number"
                          value={platformSettings.poids_supplement}
                          onChange={(e) => setPlatformSettings({ ...platformSettings, poids_supplement: parseInt(e.target.value) })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Commission Settings */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-6">
                    <Percent className="w-5 h-5 text-green-500" />
                    Commission Plateforme
                  </h2>
                  {platformSettings && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-slate-700">Type de commission</Label>
                        <Select
                          value={platformSettings.commission_type}
                          onValueChange={(value) => setPlatformSettings({ ...platformSettings, commission_type: value })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                            <SelectItem value="fixed">Montant fixe (FCFA)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-slate-700">
                          Valeur ({platformSettings.commission_type === "percentage" ? "%" : "FCFA"})
                        </Label>
                        <Input
                          type="number"
                          step={platformSettings.commission_type === "percentage" ? "0.1" : "1"}
                          value={platformSettings.commission_value}
                          onChange={(e) => setPlatformSettings({ ...platformSettings, commission_value: parseFloat(e.target.value) })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={settingsLoading} className="bg-sky-500 hover:bg-sky-600">
                  {settingsLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Sauvegarder les paramètres
                </Button>
              </div>
            </div>
  );
}
