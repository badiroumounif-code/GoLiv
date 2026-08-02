import { formatShortDate } from "./adminUtils";

export default function ContactsTab({ contacts }) {
  return (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900">Messages de contact</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="contacts-table">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Sujet</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                          Aucun message de contact
                        </td>
                      </tr>
                    ) : (
                      contacts.map((item, index) => (
                        <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-slate-600">{formatShortDate(item.created_at)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.nom}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.email}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.sujet}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{item.message}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
  );
}
