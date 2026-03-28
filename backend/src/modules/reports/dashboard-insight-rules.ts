export const DASHBOARD_INSIGHT_RULES = {
    closedStageNames: ["Fechado (Ganho)", "Fechado (Perdido)"],
    staleClientsDays: 21,
    stalledDealsDays: 10,
    lowValueDealThreshold: 1500,
    urgentCloseWindowDays: 7,
    leadWithoutActionDays: 5,
    maxItemsPerInsight: 4,
} as const;

export const DASHBOARD_INSIGHT_META = {
    staleClients: {
        title: "Clientes sem progresso",
        description: "Contatos parados por muitos dias tendem a esfriar e exigem retomada.",
        emptyMessage: "Nenhum cliente parado acima do limite definido.",
        severity: "warning",
    },
    stalledDeals: {
        title: "Negociações travadas",
        description: "Oportunidades sem movimentação recente costumam perder tração e previsibilidade.",
        emptyMessage: "Nenhuma negociação travada acima do limite configurado.",
        severity: "critical",
    },
    urgentClosings: {
        title: "Fechamentos urgentes",
        description: "Deals com previsão próxima precisam de ação imediata para não escorregar.",
        emptyMessage: "Nenhum fechamento urgente no horizonte atual.",
        severity: "critical",
    },
    lowValueDeals: {
        title: "Alertas de valor baixo",
        description: "Deals abaixo do piso merecem revisão de proposta, escopo ou esforço investido.",
        emptyMessage: "Nenhuma negociação abaixo do valor mínimo definido.",
        severity: "warning",
    },
    leadFollowUps: {
        title: "Leads sem próxima ação",
        description: "Clientes em potencial precisam de uma ação clara para não saírem do radar.",
        emptyMessage: "Todos os leads recentes têm algum sinal de acompanhamento.",
        severity: "opportunity",
    },
} as const;
