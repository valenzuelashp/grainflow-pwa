import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Image 
} from '@react-pdf/renderer';
import { getLogoUrl } from '../../utils/logo';

const LONG_BOND_SIZE: [number, number] = [612, 936];

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    position: 'relative',
    fontFamily: 'Helvetica',
    display: 'flex',
    flexDirection: 'column',
  },
  watermarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    flexDirection: 'column',
    justifyContent: 'space-around',
    padding: 10,
  },
  watermarkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    opacity: 0.02, 
    transform: 'rotate(-25deg) scale(1.1)',
    width: '120%',
    left: '-10%',
  },
  watermarkText: {
    fontSize: 20,
    color: '#000000',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#1a1a1a',
    borderBottomStyle: 'solid',
    paddingBottom: 10,
    marginBottom: 15,
    minHeight: 70, 
  },
  headerLeft: { width: '25%', textAlign: 'left' },
  headerCenter: { width: '50%', textAlign: 'center', alignItems: 'center' },
  headerRight: { width: '25%', textAlign: 'right', alignItems: 'flex-end' },
  logo: { width: 65, height: 65, borderRadius: 8 },
  storeTitle: { fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', color: '#111827' },
  storeSubText: { fontSize: 8, color: '#4b5563', marginTop: 2 },
  brandName: { fontSize: 18, fontWeight: 'bold', color: '#ea580c' },
  reportTitle: { fontSize: 9, fontWeight: 'bold', color: '#ea580c', marginTop: 2, textTransform: 'uppercase' },
  podiumContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'flex-end', 
    marginBottom: 12, 
    backgroundColor: '#f9fafb', 
    padding: 8, 
    borderRadius: 10 
  },
  podiumBox: { 
    width: 100, 
    padding: 6, 
    borderTopLeftRadius: 10, 
    borderTopRightRadius: 10, 
    alignItems: 'center', 
    marginHorizontal: 5 
  },
  rankText: { fontSize: 8, fontWeight: 'bold', marginBottom: 2, color: '#6b7280' },
  podiumName: { fontSize: 8, fontWeight: 'bold', textAlign: 'center', height: 20 },
  podiumVal: { fontSize: 10, fontWeight: 'bold', color: '#ea580c' },
  row: { 
    flexDirection: 'row', 
    borderBottomWidth: 1, 
    borderBottomColor: '#f3f4f6', 
    alignItems: 'center',
  },
  colRank: { width: '8%', fontSize: 8, fontWeight: 'bold', color: '#9ca3af' },
  colMain: { width: '52%' },
  colMainTitle: { fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' },
  colSub: { fontSize: 7, color: '#9ca3af', marginTop: 1 },
  colStats: { width: '40%', textAlign: 'right' },
  statText: { fontSize: 9, fontWeight: 'bold' },
  statLabel: { fontSize: 6, color: '#9ca3af', textTransform: 'uppercase' },
  badge: { 
    fontSize: 7, 
    fontWeight: 'bold', 
    paddingHorizontal: 4, 
    paddingVertical: 1, 
    borderRadius: 3, 
    marginTop: 1, 
    alignSelf: 'flex-end'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    borderTopStyle: 'solid',
    paddingTop: 10,
  }
});

interface Props {
  period: string;
  data: any[];
  profile: any;
  title: string;
  rankBy?: 'count' | 'kg' | 'spent';
  timeFilter?: 'all' | 'monthly';
  selectedMonth?: number;
  selectedYear?: number;
  months?: string[];
  startDate?: string;
  endDate?: string;
  filters?: any; 
}

const PrintArchive = ({ period, data, profile, title, rankBy, timeFilter, selectedMonth, selectedYear, months, startDate, endDate, filters }: Props) => {
  const isRanking = period === 'customers' || period === 'top_products';
  const ROWS_PER_PAGE = 20;

  const pages = [];
  for (let i = 0; i < data.length; i += ROWS_PER_PAGE) {
    pages.push(data.slice(i, i + ROWS_PER_PAGE));
  }

  const formatAmount = (val: any) => {
    if (typeof val === 'number') return val.toLocaleString();
    const cleanNum = parseFloat(String(val).replace(/[^\d.-]/g, ''));
    return isNaN(cleanNum) ? "0" : cleanNum.toLocaleString();
  };

  const getStatusColor = (stock: number) => {
    if (stock > 25) return { bg: '#ecfdf5', color: '#059669' };
    if (stock > 0) return { bg: '#fff7ed', color: '#ea580c' };
    return { bg: '#fef2f2', color: '#dc2626' };
  };

  const getRankLabel = () => {
    if (period === 'inventory') return "Audit of Current Stock";
    if (period === 'utang') {
        const uF = filters?.utangFilter || 'current';
        if (uF === 'paid') return "Filter: PAID UTANG RECORDS";
        if (uF === 'all') return "Filter: ALL UTANG RECORDS";
        return "Filter: UNPAID UTANG RECORDS";
    }
    if (period === 'top_products') return "Sorted by Purchase Volume (KG)"; 
    
    if (!rankBy) return "";
    return rankBy === 'count' ? "Sorted by Order Frequency" : rankBy === 'kg' ? "Sorted by Purchase Volume (KG)" : "Sorted by Total Revenue (PHP)";
  };

  const getDateRangeLabel = () => {
    if (period === 'inventory') return "AS OF: " + new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
    if (period === 'utang') return "";
    
    if (period === 'top_products') {
      if (startDate && endDate) {
        // If the dates are the same, show only one date instead of a range
        if (startDate === endDate) {
          return `DATE: ${startDate}`;
        }
        return `RANGE: ${startDate} TO ${endDate}`;
      }
      return "ALL TIME RECORDS";
    }

    return timeFilter === 'monthly' && months && selectedMonth && selectedYear 
      ? `PERIOD: ${months[selectedMonth - 1].toUpperCase()} ${selectedYear}` 
      : "PERIOD: ALL-TIME RECORDS ARCHIVE";
  };

  const logoUrl = getLogoUrl(profile?.logo_path);

  return (
    <Document>
      {pages.map((pageData, pageIdx) => (
        <Page key={pageIdx} size={LONG_BOND_SIZE} style={styles.page}>
          <View style={styles.watermarkContainer} fixed>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((row) => (
              <View key={row} style={styles.watermarkRow}>
                <Text style={styles.watermarkText}>{profile?.store_name || 'GRAINFLOW'}</Text>
                <Text style={styles.watermarkText}>{profile?.store_name || 'GRAINFLOW'}</Text>
                <Text style={styles.watermarkText}>{profile?.store_name || 'GRAINFLOW'}</Text>
              </View>
            ))}
          </View>

          <View style={styles.header} fixed>
            <View style={styles.headerLeft}>{logoUrl && <Image src={logoUrl} style={styles.logo} />}</View>
            <View style={styles.headerCenter}>
              <Text style={styles.storeTitle}>{profile?.store_name || 'GrainFlow Store'}</Text>
              <Text style={styles.storeSubText}>Owner: {profile?.name || 'Personnel'}</Text>
              <Text style={styles.storeSubText}>Address: {profile?.store_address || 'Address Not Set'}</Text>
              <Text style={styles.storeSubText}>Contact: {profile?.phone || 'N/A'}</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.brandName}>GrainFlow</Text>
              <Text style={styles.reportTitle}>
                {period === 'utang' ? 'UTANG REPORT' : period === 'top_products' ? 'TOP PRODUCTS REPORT' : `${title} REPORT`}
              </Text>
              <Text style={{ fontSize: 7, color: '#111827', fontWeight: 'bold', marginTop: 2 }}>{getDateRangeLabel()}</Text>
              <Text style={{ fontSize: 6, color: '#4b5563', fontWeight: 'bold', marginTop: 2 }}>{getRankLabel()}</Text>
              <Text style={{ fontSize: 6, color: '#9ca3af', marginTop: 2 }}>Page {pageIdx + 1} of {pages.length}</Text>
            </View>
          </View>

          <View>
            {isRanking && pageIdx === 0 && (
              <View style={styles.podiumContainer}>
                {[data[1], data[0], data[2]].filter(Boolean).map((item, index) => {
                  const actualRank = [data[1], data[0], data[2]].filter(Boolean).length === 1 ? 1 : (index === 1 ? 1 : (index === 0 ? 2 : 3));
                  
                  let displayVal = "";
                  if (rankBy === 'spent') {
                    displayVal = `P${formatAmount(item.totalSpent)}`;
                  } else if (rankBy === 'kg' || period === 'top_products') {
                    displayVal = `${item.totalKg || 0} kg`;
                  } else {
                    displayVal = `${item.count || 0} Orders`;
                  }

                  return (
                    <View key={index} style={[styles.podiumBox, { height: actualRank === 1 ? 80 : 65, borderTopWidth: 2, borderColor: actualRank === 1 ? '#fbbf24' : '#e5e7eb' }]}>
                      <Text style={styles.rankText}>RANK {actualRank}</Text>
                      <Text style={styles.podiumName}>{item.name || item.rice || "N/A"}</Text>
                      <Text style={styles.podiumVal}>{displayVal}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            <View>
              {pageData.map((item, idx) => {
                if (isRanking && pageIdx === 0 && idx < 3) return null;
                
                const stock = item.stock_quantity ?? item.stockQuantity ?? item.stock ?? 0;
                const status = getStatusColor(stock);
                
                const mainTitle = item.name || item.productName || item.rice_variety || item.rice || (Array.isArray(item) ? item[1] : "N/A");
                const subTitle = period === 'inventory' ? `Price: P${item.pricePerUnit || item.price || 0}/kg` : (Array.isArray(item) ? `Variety: ${item[2]}` : `GrainFlow Official Record`);

                return (
                  <View key={idx} style={[styles.row, { paddingVertical: 7, minHeight: 30 }]}>
                    <Text style={styles.colRank}>#{pageIdx * ROWS_PER_PAGE + idx + 1}</Text>
                    <View style={styles.colMain}>
                      <Text style={styles.colMainTitle}>{mainTitle}</Text>
                      <Text style={styles.colSub}>{subTitle}</Text>
                    </View>
                    <View style={styles.colStats}>
                      {period === 'inventory' ? (
                        <>
                          <Text style={styles.statText}>{stock} kg Available</Text>
                          <View style={[styles.badge, { backgroundColor: status.bg }]}><Text style={{ color: status.color }}>{stock > 25 ? 'IN STOCK' : stock > 0 ? 'LOW STOCK' : 'OUT OF STOCK'}</Text></View>
                        </>
                      ) : period === 'utang' ? (
                        <>
                          <Text style={[styles.statText, { color: '#dc2626' }]}>P{formatAmount(Array.isArray(item) ? item[4] : 0)}</Text>
                          {(() => {
                             const method = item[5]?.toLowerCase() || '';
                             const isPaid = item[8] && item[7] && item[8] !== item[7] && method !== 'utang';
                             const pDateDetail = item[8] ? new Date(item[8]).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : "";
                             return (
                               <>
                                 <Text style={[styles.statLabel, isPaid ? { color: '#059669' } : { color: '#dc2626' }]}>{isPaid ? `PAID VIA ${method.toUpperCase()}` : 'UNPAID BALANCE'}</Text>
                                 <Text style={{ fontSize: 5, color: '#9ca3af' }}>Ordered: {item[6]}</Text>
                                 {isPaid && <Text style={{ fontSize: 5, color: '#059669', fontWeight: 'bold' }}>Paid: {pDateDetail}</Text>}
                               </>
                             );
                          })()}
                        </>
                      ) : (
                        <>
                          <Text style={[styles.statText, period === 'customers' ? {color: '#dc2626'} : {}]}>
                            {rankBy === 'spent' 
                              ? `P${formatAmount(item.totalSpent || 0)}` 
                              : (rankBy === 'kg' || period === 'top_products' 
                                  ? `${item.totalKg || 0} kg` 
                                  : `${item.count || 0} Orders`
                                )
                            }
                          </Text>
                          <Text style={styles.statLabel}>
                            {rankBy === 'spent' 
                              ? 'Gross Spending' 
                              : (rankBy === 'kg' || period === 'top_products' 
                                  ? 'Total Volume' 
                                  : 'Order Frequency'
                                )
                            }
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
          <View style={styles.footer} fixed>
            <Text style={{ fontSize: 7, color: '#9ca3af', textAlign: 'center' }}>GrainFlow Business Intelligence Archive • Generated: {new Date().toLocaleString('en-PH')}</Text>
          </View>
        </Page>
      ))}
    </Document>
  );
};

export default PrintArchive;