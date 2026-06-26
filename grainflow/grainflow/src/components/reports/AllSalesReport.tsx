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
    paddingVertical: 100, 
  },
  watermarkRow: {
    flexDirection: 'row',
    justifyContent: 'center', 
    opacity: 0.05, 
    transform: 'rotate(-25deg)', 
    width: '100%',
    marginVertical: 40, 
  },
  watermarkText: {
    fontSize: 22, 
    color: '#000000', 
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginHorizontal: 100, 
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
  logo: { width: 65, height: 65, objectFit: 'contain', borderRadius: 8 },
  storeTitle: { fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', color: '#111827' },
  storeSubText: { fontSize: 8, color: '#4b5563', marginTop: 2 },
  brandName: { fontSize: 18, fontWeight: 'bold', color: '#ea580c' },
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    fontSize: 9,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  table: { 
    width: '100%', 
    marginTop: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    color: '#ffffff',
    fontSize: 7,
    fontWeight: 'bold',
    padding: 8,
    borderRadius: 2,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    borderBottomStyle: 'solid',
    fontSize: 8,
    paddingVertical: 6, 
    paddingHorizontal: 7,
    alignItems: 'center',
    minHeight: 32, // Accommodates double lines
  },
  colId: { width: '12%', textAlign: 'center' },
  colCustomer: { width: '18%', textAlign: 'center' },
  colRice: { width: '18%', textAlign: 'center' }, 
  colQty: { width: '5%', textAlign: 'center' },
  colAmt: { width: '14%', textAlign: 'center', fontWeight: 'bold' },
  colMethod: { 
    width: '13%', 
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  colTime: { width: '18%', textAlign: 'center' }, 
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    borderTopStyle: 'solid',
    paddingTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  signatureContainer: {
    alignItems: 'center',
    width: 180,
  },
  signatureLine: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    borderBottomStyle: 'solid',
    marginBottom: 4,
  },
  signatoryName: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  signatoryTitle: {
    fontSize: 7,
    color: '#666666',
  }
});

interface Props {
  title: string;
  dateLabel: string;
  rows: any[][];
  profile: any;
  filters?: {
    customer?: string;
    rice?: string;
    method?: string;
  };
}

const AllSalesReport = ({ title, dateLabel, rows, profile, filters }: Props) => {
  const ROWS_PER_PAGE = 18; // Reduced slightly for vertical space
  const pages = [];
  
  for (let i = 0; i < rows.length; i += ROWS_PER_PAGE) {
    pages.push(rows.slice(i, i + ROWS_PER_PAGE));
  }

  const generatedTime = new Date().toLocaleString('en-PH');

  const getLogoSource = () => getLogoUrl(profile?.logo_path);

  const logoSrc = getLogoSource();
  const watermarkText = profile?.store_name || 'GRAINFLOW';

  return (
    <Document>
      {pages.map((pageRows, index) => (
        <Page key={index} size={LONG_BOND_SIZE} style={styles.page}>
          
          <View style={styles.watermarkContainer} fixed>
            {[1, 2, 3, 4, 5].map((row) => (
              <View key={row} style={styles.watermarkRow}>
                <Text style={styles.watermarkText}>{watermarkText}</Text>
                <Text style={styles.watermarkText}>{watermarkText}</Text>
              </View>
            ))}
          </View>

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {logoSrc && <Image src={logoSrc} style={styles.logo} />}
            </View>

            <View style={styles.headerCenter}>
              <Text style={styles.storeTitle}>{profile?.store_name || 'GrainFlow Store'}</Text>
              <Text style={styles.storeSubText}>Owner: {profile?.name || 'Authorized Personnel'}</Text>
              <Text style={styles.storeSubText}>Address: {profile?.store_address || 'Address Not Set'}</Text>
              <Text style={styles.storeSubText}>Contact: {profile?.phone || 'N/A'}</Text>
            </View>

            <View style={styles.headerRight}>
              <Text style={styles.brandName}>GrainFlow</Text>
              <Text style={[styles.storeSubText, { textTransform: 'uppercase', color: '#ea580c', fontWeight: 'bold' }]}>
                Official Report
              </Text>
            </View>
          </View>

          <View style={styles.metaSection}>
            <View style={{ width: '60%' }}>
              <Text style={{ fontWeight: 'bold', color: '#111827', fontSize: 10 }}>{title}</Text>
              <Text style={{ marginTop: 2, color: '#6b7280' }}>Reporting Period: {dateLabel}</Text>
              
              {(filters?.customer || filters?.rice || filters?.method) && (
                <View style={{ marginTop: 6, borderLeftWidth: 2, borderLeftColor: '#ea580c', paddingLeft: 6 }}>
                  <Text style={{ fontSize: 7, color: '#111827', fontWeight: 'bold' }}>Filtered To:</Text>
                  {filters?.customer && <Text style={{ fontSize: 7, color: '#4b5563' }}>• Customer: {filters.customer.toUpperCase()}</Text>}
                  {filters?.rice && <Text style={{ fontSize: 7, color: '#4b5563' }}>• Variety: {filters.rice.toUpperCase()}</Text>}
                  {filters?.method && <Text style={{ fontSize: 7, color: '#4b5563' }}>• Method: {filters.method.toUpperCase()}</Text>}
                </View>
              )}
            </View>
            <View style={{ textAlign: 'right', color: '#6b7280', width: '40%' }}>
              <Text>Generated on: {generatedTime}</Text>
              <Text style={{ marginTop: 2 }}>Page {index + 1} of {pages.length}</Text>
              <Text style={{ marginTop: 2, fontWeight: 'bold', color: '#111827' }}>Total Records: {rows.length}</Text>
            </View>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colId}>ID</Text>
              <Text style={styles.colCustomer}>CUSTOMER NAME</Text>
              <Text style={styles.colRice}>RICE VARIETY</Text>
              <Text style={styles.colQty}>QTY (KG)</Text>
              <Text style={styles.colAmt}>AMOUNT</Text>
              <Text style={styles.colMethod}>METHOD</Text>
              <Text style={styles.colTime}>DATE & TIME</Text>
            </View>

            {pageRows.map((row, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.colId}>{row[0]}</Text>
                <Text style={styles.colCustomer}>{row[1] || 'Walk-in'}</Text>
                <Text style={styles.colRice}>{row[2]}</Text>
                <Text style={styles.colQty}>{row[3]}</Text>
                <Text style={styles.colAmt}>P{parseFloat(row[4]).toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
                
                <View style={styles.colMethod}>
                  <Text>{row[5].split('\n')[0]}</Text>
                  {row[5].includes('\n') && (
                    <Text style={{ fontSize: 6, color: '#6b7280', marginTop: 1 }}>
                      {row[5].split('\n')[1]}
                    </Text>
                  )}
                </View>

                <Text style={styles.colTime}>{row[6]}</Text>
              </View>
            ))}
          </View>

          <View style={styles.footer} fixed>
            <View>
                <Text style={{ fontSize: 7, color: '#9ca3af' }}>GrainFlow POS - Secure Transaction Record</Text>
                <Text style={{ fontSize: 6, color: '#d1d5db', marginTop: 2 }}>User ID: {profile?.id}</Text>
            </View>
            <View style={styles.signatureContainer}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatoryName}>{profile?.name || 'Authorized Signatory'}</Text>
              <Text style={styles.signatoryTitle}>Manager</Text>
              <Text style={styles.signatoryTitle}>Date: {new Date().toLocaleDateString()}</Text>
            </View>
          </View>
        </Page>
      ))}
    </Document>
  );
};

export default AllSalesReport;