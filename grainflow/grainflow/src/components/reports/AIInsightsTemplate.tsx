import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface AIInsightsProps {
    data: {
        generatedAt: string;
        aiRecommendation: string;
        predictions: {
            variety: string;
            status: string;
            prediction: string;
            confidence: number;
        }[];
        growthMetrics: {
            weeklyGrowth: string;
            customerRetention: string;
            busiestTime: string;
            totalRevenue: string; // This is the Current Monthly Revenue
            unitsSold: string;
            revenueTarget: string;
            goalPercentage: number;
            returningCustomers: number;
            newCustomers: number;
            netProfit: string; // Added to reflect the profit card
        };
    };
    profile: any;
}

const styles = StyleSheet.create({
    page: { padding: 40, backgroundColor: '#FAF9F6', color: '#4A463F', fontFamily: 'Helvetica' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#E8E6E1', paddingBottom: 15 },
    brandContainer: { flexDirection: 'column' },
    title: { fontSize: 22, fontWeight: 'bold', color: '#4A463F' },
    subtitle: { fontSize: 8, color: '#C2A378', letterSpacing: 1.5, marginTop: 4, fontWeight: 'bold', textTransform: 'uppercase' },
    metaText: { fontSize: 8, color: '#8b867a', textAlign: 'right', textTransform: 'uppercase' },
    genDate: { fontSize: 9, color: '#4A463F', textAlign: 'right', marginTop: 2 },
    
    // Revenue Goal Section (Matches Analytics Row 1)
    goalSection: { backgroundColor: '#ffffff', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#E8E6E1' },
    goalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    progressBar: { width: '100%', height: 6, backgroundColor: '#F5F5F0', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#C2A378' },

    metricsGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    metricBoxMain: { flex: 1, backgroundColor: '#4A463F', padding: 12, borderRadius: 12 },
    metricBoxAlt: { flex: 1, backgroundColor: '#ffffff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E8E6E1' },
    metricLabel: { fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase', color: '#8b867a' },
    metricLabelLight: { fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase', color: '#FAF9F6', opacity: 0.8 },
    metricValue: { fontSize: 13, fontWeight: 'bold', marginTop: 4, color: '#4A463F' },
    metricValueLight: { fontSize: 13, fontWeight: 'bold', marginTop: 4, color: '#FAF9F6' },

    aiHighlight: { backgroundColor: 'rgba(194, 163, 120, 0.08)', borderLeftWidth: 3, borderLeftColor: '#C2A378', padding: 15, borderRadius: 8, marginBottom: 20 },
    aiHighlightTitle: { fontSize: 8, fontWeight: 'bold', color: '#C2A378', marginBottom: 5, textTransform: 'uppercase' },
    aiHighlightText: { fontSize: 10, fontWeight: 'bold', fontStyle: 'italic', lineHeight: 1.4, color: '#4A463F' },

    sectionTitle: { fontSize: 9, fontWeight: 'bold', color: '#8b867a', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 1 },
    
    // Table Styling (Matches 5th Row logic)
    table: { width: '100%', backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#E8E6E1', overflow: 'hidden' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F5F5F0', padding: 10, alignItems: 'center' },
    tableHeader: { backgroundColor: '#F5F5F0' },
    headerCell: { fontSize: 7, fontWeight: 'bold', color: '#8b867a', textTransform: 'uppercase' },
    cellVariety: { width: '25%' },
    cellPrediction: { width: '45%' },
    cellStatus: { width: '15%', textAlign: 'center' },
    cellConf: { width: '15%', textAlign: 'right' },
    statusBadge: { fontSize: 6, padding: '2 5', borderRadius: 10, textAlign: 'center', fontWeight: 'bold' },

    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#E8E6E1', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
    footerText: { fontSize: 7, color: '#8b867a' }
});

const AIInsightsTemplate = ({ data, profile }: AIInsightsProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header Area */}
            <View style={styles.header}>
                <View style={styles.brandContainer}>
                    <Text style={styles.title}>GrainFlow Intelligence</Text>
                    <Text style={styles.subtitle}>Executive Business Analytics Report</Text>
                </View>
                <View>
                    <Text style={styles.metaText}>Status: Live Sync Enabled</Text>
                    <Text style={styles.genDate}>{data.generatedAt}</Text>
                    <Text style={[styles.metaText, { marginTop: 4 }]}>Store ID: {profile?.store_name || 'GrainFlow Merchant'}</Text>
                </View>
            </View>

            {/* AI Recommendation (Prescriptive Engine Row) */}
            <View style={styles.aiHighlight}>
                <Text style={styles.aiHighlightTitle}>AI Forecast Sentiment & Prescriptive Directives</Text>
                <Text style={styles.aiHighlightText}>"{data.aiRecommendation}"</Text>
            </View>

            {/* Monthly Goal Tracker (Matches Analytics Row 1) */}
            <View style={styles.goalSection}>
                <View style={styles.goalHeader}>
                    <Text style={styles.metricLabel}>Monthly Revenue Progress</Text>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#C2A378' }}>{data.growthMetrics.goalPercentage}% Achieved</Text>
                </View>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${data.growthMetrics.goalPercentage}%` }]} />
                </View>
                <Text style={{ fontSize: 8, color: '#8b867a', marginTop: 5 }}>
                    Target: {data.growthMetrics.revenueTarget} • Current Revenue: {data.growthMetrics.totalRevenue}
                </Text>
            </View>

            {/* Core Metrics Grid (Matches KPI Row 2 & 3) */}
            <View style={styles.metricsGrid}>
                <View style={styles.metricBoxMain}>
                    <Text style={styles.metricLabelLight}>Net Monthly Profit</Text>
                    <Text style={styles.metricValueLight}>₱{data.growthMetrics.netProfit}</Text>
                    <Text style={{ fontSize: 7, marginTop: 2, color: '#FAF9F6', opacity: 0.6 }}>Estimated Tubo</Text>
                </View>
                <View style={styles.metricBoxAlt}>
                    <Text style={styles.metricLabel}>Peak Performance</Text>
                    <Text style={styles.metricValue}>{data.growthMetrics.busiestTime}</Text>
                    <Text style={{ fontSize: 7, marginTop: 2, color: '#8b867a' }}>Busiest Store Hour</Text>
                </View>
                <View style={styles.metricBoxAlt}>
                    <Text style={styles.metricLabel}>Total Kilos Sold</Text>
                    <Text style={styles.metricValue}>{data.growthMetrics.unitsSold}</Text>
                    <Text style={{ fontSize: 7, marginTop: 2, color: '#8b867a' }}>Volume Mix Total</Text>
                </View>
            </View>

            {/* Inventory Intelligence Table (Matches Analytics 5th Row Split) */}
            <Text style={styles.sectionTitle}>Variety Demand Breakdown & Projections</Text>
            <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.headerCell, styles.cellVariety]}>Rice Variety</Text>
                    <Text style={[styles.headerCell, styles.cellPrediction]}>Market Intelligence</Text>
                    <Text style={[styles.headerCell, styles.cellStatus]}>Demand</Text>
                    <Text style={[styles.headerCell, styles.cellConf]}>Confidence</Text>
                </View>

                {data.predictions.map((p, i) => (
                    <View key={i} style={styles.tableRow}>
                        <View style={styles.cellVariety}>
                            <Text style={{ fontWeight: 'bold', fontSize: 9 }}>{p.variety}</Text>
                        </View>
                        <View style={styles.cellPrediction}>
                            <Text style={{ fontSize: 8, color: '#4A463F' }}>{p.prediction}</Text>
                        </View>
                        <View style={styles.cellStatus}>
                            <Text style={[styles.statusBadge, { 
                                backgroundColor: p.status.toLowerCase().includes('high') ? 'rgba(194, 163, 120, 0.2)' : 'rgba(74, 70, 63, 0.1)',
                                color: p.status.toLowerCase().includes('high') ? '#C2A378' : '#4A463F'
                            }]}>{p.status.toUpperCase()}</Text>
                        </View>
                        <View style={styles.cellConf}>
                            <Text style={{ fontSize: 8 }}>{p.confidence}%</Text>
                            <View style={{ width: '100%', height: 3, backgroundColor: '#F5F5F0', borderRadius: 2, marginTop: 3 }}>
                                <View style={{ height: '100%', backgroundColor: '#C2A378', borderRadius: 2, width: `${p.confidence}%` }} />
                            </View>
                        </View>
                    </View>
                ))}
            </View>

            {/* Cohort Health & Disclaimer (Matches Row 6) */}
            <View style={{ marginTop: 20, flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1, padding: 12, backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#E8E6E1' }}>
                    <Text style={styles.metricLabel}>Merchant Cohort Health</Text>
                    <View style={{ marginTop: 8 }}>
                        <Text style={{ fontSize: 9 }}>Returning Sukis: {data.growthMetrics.returningCustomers}%</Text>
                        <Text style={{ fontSize: 9, marginTop: 4 }}>New Acquisition: {data.growthMetrics.newCustomers}%</Text>
                    </View>
                </View>
                <View style={{ flex: 1, padding: 10, justifyContent: 'center' }}>
                    <Text style={{ fontSize: 7, color: '#8b867a', fontStyle: 'italic', textAlign: 'right' }}>
                        * This intelligence report is generated using real-time transaction data and stock depletion patterns. 
                        Owner verification is recommended for critical stock reordering.
                    </Text>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer} fixed>
                <Text style={styles.footerText}>GrainFlow BI • Decision Intelligence Unit</Text>
                <Text style={styles.footerText}>Certified by: {profile?.name || 'Authorized Merchant'} • Page 1 of 1</Text>
            </View>
        </Page>
    </Document>
);

export default AIInsightsTemplate;