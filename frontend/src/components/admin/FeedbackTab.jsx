import { Download, Star } from "lucide-react";
import { Button } from "../ui/button";
import { formatShortDate } from "./adminUtils";

export default function FeedbackTab({ handleExport, feedback }) {
  return (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Avis clients</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("feedback")}
                  className="rounded-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="feedback-table">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Note</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Commentaire</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Problèmes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedback.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                          Aucun avis client
                        </td>
                      </tr>
                    ) : (
                      feedback.map((item, index) => (
                        <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-slate-600">{formatShortDate(item.created_at)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.nom}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${star <= item.note ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                                />
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 max-w-xs">{item.commentaire}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 max-w-xs">{item.problemes || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
  );
}
