// Pure formatting/labeling helpers shared by the admin tabs and dialogs.

export const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export const formatShortDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit"
  });
};

export const getUrgencyBadge = (urgence) => {
  const badges = {
    standard: "bg-slate-100 text-slate-700",
    express: "bg-amber-100 text-amber-700",
    urgent: "bg-red-100 text-red-700"
  };
  return badges[urgence] || badges.standard;
};

export const getStatusBadge = (status) => {
  const badges = {
    nouveau: "bg-sky-100 text-sky-700",
    en_attente: "bg-amber-100 text-amber-700",
    accepte: "bg-green-100 text-green-700",
    refuse: "bg-red-100 text-red-700",
    assigne: "bg-purple-100 text-purple-700",
    en_cours: "bg-blue-100 text-blue-700",
    livre: "bg-green-100 text-green-700",
    annule: "bg-red-100 text-red-700"
  };
  return badges[status] || "bg-slate-100 text-slate-700";
};

export const getStatusLabel = (status) => {
  const labels = {
    nouveau: "Nouveau",
    en_attente: "En attente",
    accepte: "Accepté",
    refuse: "Refusé",
    assigne: "Assigné",
    en_cours: "En cours",
    livre: "Livré",
    annule: "Annulé"
  };
  return labels[status] || status;
};

// Items per page, shared by every paginated admin table.
export const ITEMS_PER_PAGE = 10;
