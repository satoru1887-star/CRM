/**
 * ===================================================================
 * ระบบ CRM สำหรับตัวแทนประกัน — Google Apps Script + Google Sheet
 * ===================================================================
 * โครงสร้างชีต:
 *  - Customers          ข้อมูลส่วนตัวลูกค้า
 *  - PoliciesLifeHealth ประกันชีวิต/สุขภาพ/โรคร้ายแรง/อุบัติเหตุ/บำนาญ
 *  - PoliciesCar        ประกันรถยนต์
 *  - PoliciesFire       ประกันอัคคีภัยบ้าน
 *  - PoliciesTravel     ประกันเดินทาง
 *  - PoliciesOther      สินค้าอื่นๆ
 *  - ServiceRecords     บริการหลังการขาย
 *  - Deals              ระบบติดตามลูกค้า (ดีล)
 *  - Settings           ค่าตั้งค่าทั่วไป (เช่น เป้าหมายยอดขาย)
 */

// ===================== ค่าคงที่ =====================
const SHEET_CUSTOMERS = 'Customers';
const HEADERS_CUSTOMERS = ['ID', 'ชื่อครอบครัว', 'ชื่อ-นามสกุลผู้เอาประกัน', 'วันเดือนปีเกิด', 'ที่อยู่', 'เบอร์โทรศัพท์', 'อีเมล', 'Remark', 'วันที่สร้าง', 'วันที่อัปเดต'];

const SHEET_POLICY_LIFE = 'PoliciesLifeHealth';
const HEADERS_POLICY_LIFE = ['ID', 'CustomerID', 'ลำดับ', 'ประเภท', 'เลขที่กรมธรรม์', 'วันที่กรมธรรม์', 'บริษัทประกัน', 'สัญญาหลัก', 'สัญญาเพิ่มเติม', 'วันที่ครบกำหนดชำระเบี้ย', 'Remark', 'วันที่สร้าง', 'วันที่อัปเดต'];

const SHEET_POLICY_CAR = 'PoliciesCar';
const HEADERS_POLICY_CAR = ['ID', 'CustomerID', 'ลำดับที่', 'ทะเบียนรถ', 'ยี่ห้อ', 'รุ่นรถ', 'วันที่จดทะเบียน', 'บริษัทประกัน', 'ประเภท', 'เบี้ยสุทธิ', 'วันที่สิ้นสุดความคุ้มครอง', 'New Business/Renewal', 'โบรคเกอร์', 'วันที่สร้าง', 'วันที่อัปเดต'];

const SHEET_POLICY_FIRE = 'PoliciesFire';
const HEADERS_POLICY_FIRE = ['ID', 'CustomerID', 'ลำดับที่', 'สถานที่เอาประกัน', 'ประเภท', 'บริษัทประกัน', 'ระยะเวลา', 'เบี้ยสุทธิ', 'วันที่สิ้นสุดความคุ้มครอง', 'New Business/Renewal', 'โบรคเกอร์', 'วันที่สร้าง', 'วันที่อัปเดต'];

const SHEET_POLICY_TRAVEL = 'PoliciesTravel';
const HEADERS_POLICY_TRAVEL = ['ID', 'CustomerID', 'บริษัทประกัน', 'ประเภท', 'ประเทศ', 'วันที่เดินทางไป', 'วันที่เดินทางกลับ', 'เบี้ยสุทธิ', 'วันที่สร้าง', 'วันที่อัปเดต'];

const SHEET_POLICY_OTHER = 'PoliciesOther';
const HEADERS_POLICY_OTHER = ['ID', 'CustomerID', 'รายละเอียด', 'วันที่สร้าง', 'วันที่อัปเดต'];

const SHEET_SERVICE = 'ServiceRecords';
const HEADERS_SERVICE = ['ID', 'CustomerID', 'ประเภท', 'รายละเอียด', 'วันที่', 'วันที่สร้าง'];

const SHEET_DEALS = 'Deals';
const HEADERS_DEALS = [
  'ID', 'CustomerID', 'ชื่อลูกค้า', 'ผลิตภัณฑ์', 'สถานะ', 'มูลค่า',
  'วันที่ดีลใหม่', 'รายละเอียดดีลใหม่',
  'วันที่ติดต่อแล้ว', 'รายละเอียดติดต่อแล้ว',
  'วันที่เสนอราคา', 'รายละเอียดเสนอราคา',
  'วันที่กำลังเจรจา', 'รายละเอียดกำลังเจรจา',
  'วันที่ปิดการขาย', 'รายละเอียดปิดการขาย',
  'วันนัดหมายถัดไป', 'หมายเหตุนัดหมาย',
  'วันที่สร้าง', 'วันที่อัปเดต'
];
// โครงสร้างเวอร์ชันก่อนหน้า (ยังไม่มีคอลัมน์ "รายละเอียดดีลใหม่") ใช้เทียบเพื่ออัปเกรดชีตเดิมแบบไม่ทำข้อมูลหาย
const HEADERS_DEALS_LEGACY_NO_NEWDETAIL = [
  'ID', 'CustomerID', 'ชื่อลูกค้า', 'ผลิตภัณฑ์', 'สถานะ', 'มูลค่า',
  'วันที่ดีลใหม่',
  'วันที่ติดต่อแล้ว', 'รายละเอียดติดต่อแล้ว',
  'วันที่เสนอราคา', 'รายละเอียดเสนอราคา',
  'วันที่กำลังเจรจา', 'รายละเอียดกำลังเจรจา',
  'วันที่ปิดการขาย', 'รายละเอียดปิดการขาย',
  'วันนัดหมายถัดไป', 'หมายเหตุนัดหมาย',
  'วันที่สร้าง', 'วันที่อัปเดต'
];

const SHEET_SETTINGS = 'Settings';
const HEADERS_SETTINGS = ['Key', 'Value'];

const SHEET_APPOINTMENTS = 'Appointments';
const HEADERS_APPOINTMENTS = ['ID', 'CustomerID', 'ชื่อลูกค้า', 'วันนัดหมาย', 'รายละเอียด/หมายเหตุ', 'วันที่สร้าง', 'วันที่อัปเดต'];

const DEAL_STAGES = ['ดีลใหม่', 'ติดต่อแล้ว', 'เสนอราคา', 'กำลังเจรจา', 'ปิดการขาย'];
const PRODUCT_TYPES = ['ประกันชีวิต', 'ประกันสุขภาพ', 'ประกันโรคร้ายแรง', 'ประกันอุบัติเหตุ', 'ประกันรถยนต์', 'ประกันอัคคีภัย', 'ประกันเดินทาง', 'สินค้าอื่นๆ'];
const LIFE_HEALTH_TYPES = ['ประกันชีวิต', 'ประกันสุขภาพ', 'ประกันโรคร้ายแรง', 'ประกันอุบัติเหตุ', 'ประกันบำนาญ'];
const SERVICE_TYPES = ['เคลม', 'เปลี่ยนแปลง', 'เยี่ยมเยียน', 'อื่นๆ'];
const NB_RENEWAL_OPTIONS = ['New Business', 'Renewal'];
const FIRE_PERIODS = ['1 ปี', '2 ปี', '3 ปี', '5 ปี', 'มากกว่า 5 ปี'];
const TRAVEL_TYPES = ['รายเที่ยว', 'รายปี'];
const BROKERS = ['AIA', 'AIG', 'Pacific Cross', 'SK.', 'Tbroker', 'MIB'];

const POLICY_CONFIG = {
  life: { sheet: SHEET_POLICY_LIFE, headers: HEADERS_POLICY_LIFE },
  car: { sheet: SHEET_POLICY_CAR, headers: HEADERS_POLICY_CAR },
  fire: { sheet: SHEET_POLICY_FIRE, headers: HEADERS_POLICY_FIRE },
  travel: { sheet: SHEET_POLICY_TRAVEL, headers: HEADERS_POLICY_TRAVEL },
  other: { sheet: SHEET_POLICY_OTHER, headers: HEADERS_POLICY_OTHER }
};

// ===================== เว็บแอป =====================
function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('CRM ตัวแทนประกัน')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getConstants() {
  return {
    dealStages: DEAL_STAGES,
    productTypes: PRODUCT_TYPES,
    lifeHealthTypes: LIFE_HEALTH_TYPES,
    serviceTypes: SERVICE_TYPES,
    nbRenewalOptions: NB_RENEWAL_OPTIONS,
    firePeriods: FIRE_PERIODS,
    travelTypes: TRAVEL_TYPES,
    brokers: BROKERS
  };
}

// ===================== ตัวช่วยทั่วไปสำหรับชีต =====================
function getSheetGeneric_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1B2E2B').setFontColor('#F6F3EC');
    sheet.autoResizeColumns(1, headers.length);
  }
  return sheet;
}

function findRowById_(sheet, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) return i + 2;
  }
  return -1;
}

function sheetToObjects_(sheet, headers, mapFn) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return data.filter(function (r) { return r[0] !== ''; }).map(mapFn);
}

function getTz_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
}

function dateVal_(v) {
  if (!(v instanceof Date)) return v || '';
  // ใช้ timezone ของสเปรดชีตในการแปลงกลับ แทน toISOString() (ซึ่งแปลงเป็น UTC แล้วทำให้วันที่คลาดเคลื่อนไป 1 วันได้)
  return Utilities.formatDate(v, getTz_(), "yyyy-MM-dd'T'HH:mm:ss");
}

function toDateOrBlank_(str) {
  if (!str) return '';
  // ใช้ timezone เดียวกับ dateVal_ เพื่อให้แปลงกลับไป-มาได้ค่าตรงกันเสมอ
  return Utilities.parseDate(str + ' 00:00:00', getTz_(), 'yyyy-MM-dd HH:mm:ss');
}

// ===================== Customers (ลูกค้า) =====================
function getCustomersSheet_() {
  return getSheetGeneric_(SHEET_CUSTOMERS, HEADERS_CUSTOMERS);
}

function customerRowToObject_(r) {
  return {
    id: r[0], familyName: r[1], fullName: r[2], birthDate: dateVal_(r[3]),
    address: r[4], phone: r[5], email: r[6], remark: r[7],
    createdAt: dateVal_(r[8]), updatedAt: dateVal_(r[9])
  };
}

function getCustomers() {
  const sheet = getCustomersSheet_();
  return sheetToObjects_(sheet, HEADERS_CUSTOMERS, customerRowToObject_);
}

function getCustomer(id) {
  const all = getCustomers();
  const found = all.filter(function (c) { return c.id === id; });
  return found.length ? found[0] : null;
}

function addCustomer(c) {
  const sheet = getCustomersSheet_();
  const id = Utilities.getUuid();
  const now = new Date();
  const row = sheet.getLastRow() + 1;
  // ตั้งฟอร์แมตคอลัมน์เบอร์โทรศัพท์เป็นข้อความก่อนใส่ค่า ป้องกันเลข 0 ตัวแรกหายไป
  sheet.getRange(row, 6).setNumberFormat('@');
  sheet.getRange(row, 1, 1, 10).setValues([[
    id, c.familyName || '', c.fullName || '', toDateOrBlank_(c.birthDate),
    c.address || '', String(c.phone || ''), c.email || '', c.remark || '', now, now
  ]]);
  return id;
}

function updateCustomer(c) {
  const sheet = getCustomersSheet_();
  const row = findRowById_(sheet, c.id);
  if (row === -1) throw new Error('ไม่พบข้อมูลลูกค้า');
  // ตั้งฟอร์แมตคอลัมน์เบอร์โทรศัพท์เป็นข้อความก่อนใส่ค่า ป้องกันเลข 0 ตัวแรกหายไป
  sheet.getRange(row, 6).setNumberFormat('@');
  sheet.getRange(row, 2, 1, 6).setValues([[
    c.familyName || '', c.fullName || '', toDateOrBlank_(c.birthDate), c.address || '', String(c.phone || ''), c.email || ''
  ]]);
  sheet.getRange(row, 8).setValue(c.remark || '');
  sheet.getRange(row, 10).setValue(new Date());
  return true;
}

function deleteCustomer(id) {
  const sheet = getCustomersSheet_();
  const row = findRowById_(sheet, id);
  if (row === -1) throw new Error('ไม่พบข้อมูลลูกค้า');
  sheet.deleteRow(row);
  return true;
}

// ===================== Policies (กรมธรรม์ 5 หมวด แบบ generic) =====================
function getPolicySheet_(category) {
  const cfg = POLICY_CONFIG[category];
  if (!cfg) throw new Error('หมวดกรมธรรม์ไม่ถูกต้อง: ' + category);
  return getSheetGeneric_(cfg.sheet, cfg.headers);
}

function policyRowToObject_(category, r) {
  switch (category) {
    case 'life':
      return { id: r[0], customerId: r[1], seq: r[2], type: r[3], policyNo: r[4], policyDate: dateVal_(r[5]), company: r[6], mainContract: r[7], riders: r[8], dueDate: dateVal_(r[9]), remark: r[10], createdAt: dateVal_(r[11]), updatedAt: dateVal_(r[12]) };
    case 'car':
      return { id: r[0], customerId: r[1], seq: r[2], plate: r[3], brand: r[4], model: r[5], regDate: dateVal_(r[6]), company: r[7], type: r[8], premium: r[9], endDate: dateVal_(r[10]), nbRenewal: r[11], broker: r[12], createdAt: dateVal_(r[13]), updatedAt: dateVal_(r[14]) };
    case 'fire':
      return { id: r[0], customerId: r[1], seq: r[2], location: r[3], type: r[4], company: r[5], period: r[6], premium: r[7], endDate: dateVal_(r[8]), nbRenewal: r[9], broker: r[10], createdAt: dateVal_(r[11]), updatedAt: dateVal_(r[12]) };
    case 'travel':
      return { id: r[0], customerId: r[1], company: r[2], type: r[3], country: r[4], departDate: dateVal_(r[5]), returnDate: dateVal_(r[6]), premium: r[7], createdAt: dateVal_(r[8]), updatedAt: dateVal_(r[9]) };
    case 'other':
      return { id: r[0], customerId: r[1], detail: r[2], createdAt: dateVal_(r[3]), updatedAt: dateVal_(r[4]) };
  }
}

function policyObjectToRow_(category, p, id, now) {
  switch (category) {
    case 'life':
      return [id, p.customerId, p.seq || '', p.type || '', p.policyNo || '', toDateOrBlank_(p.policyDate), p.company || '', p.mainContract || '', p.riders || '', toDateOrBlank_(p.dueDate), p.remark || '', now, now];
    case 'car':
      return [id, p.customerId, p.seq || '', p.plate || '', p.brand || '', p.model || '', toDateOrBlank_(p.regDate), p.company || '', p.type || '', p.premium || 0, toDateOrBlank_(p.endDate), p.nbRenewal || '', p.broker || '', now, now];
    case 'fire':
      return [id, p.customerId, p.seq || '', p.location || '', p.type || '', p.company || '', p.period || '', p.premium || 0, toDateOrBlank_(p.endDate), p.nbRenewal || '', p.broker || '', now, now];
    case 'travel':
      return [id, p.customerId, p.company || '', p.type || '', p.country || '', toDateOrBlank_(p.departDate), toDateOrBlank_(p.returnDate), p.premium || 0, now, now];
    case 'other':
      return [id, p.customerId, p.detail || '', now, now];
  }
}

function getPolicies(category, customerId) {
  const sheet = getPolicySheet_(category);
  const cfg = POLICY_CONFIG[category];
  const all = sheetToObjects_(sheet, cfg.headers, function (r) { return policyRowToObject_(category, r); });
  if (!customerId) return all;
  return all.filter(function (p) { return p.customerId === customerId; });
}

function addPolicy(category, data) {
  const sheet = getPolicySheet_(category);
  const id = Utilities.getUuid();
  const now = new Date();
  sheet.appendRow(policyObjectToRow_(category, data, id, now));
  return id;
}

function updatePolicy(category, data) {
  const sheet = getPolicySheet_(category);
  const cfg = POLICY_CONFIG[category];
  const row = findRowById_(sheet, data.id);
  if (row === -1) throw new Error('ไม่พบข้อมูล');
  const now = new Date();
  const createdAtCol = cfg.headers.length - 1; // ตำแหน่งคอลัมน์ "วันที่สร้าง" (1-indexed)
  const oldCreatedAt = sheet.getRange(row, createdAtCol).getValue();
  const newRow = policyObjectToRow_(category, data, data.id, now);
  newRow[createdAtCol - 1] = oldCreatedAt; // คงวันที่สร้างเดิมไว้ (0-indexed ในอาเรย์)
  sheet.getRange(row, 1, 1, cfg.headers.length).setValues([newRow]);
  return true;
}

function deletePolicy(category, id) {
  const sheet = getPolicySheet_(category);
  const row = findRowById_(sheet, id);
  if (row === -1) throw new Error('ไม่พบข้อมูล');
  sheet.deleteRow(row);
  return true;
}

// ===================== ServiceRecords (บริการหลังการขาย) =====================
function getServiceRecords(customerId) {
  const sheet = getSheetGeneric_(SHEET_SERVICE, HEADERS_SERVICE);
  const all = sheetToObjects_(sheet, HEADERS_SERVICE, function (r) {
    return { id: r[0], customerId: r[1], type: r[2], detail: r[3], date: dateVal_(r[4]), createdAt: dateVal_(r[5]) };
  });
  if (!customerId) return all;
  return all.filter(function (s) { return s.customerId === customerId; });
}

function addServiceRecord(s) {
  const sheet = getSheetGeneric_(SHEET_SERVICE, HEADERS_SERVICE);
  const id = Utilities.getUuid();
  const now = new Date();
  const d = s.date ? toDateOrBlank_(s.date) : now;
  sheet.appendRow([id, s.customerId, s.type || '', s.detail || '', d, now]);
  return id;
}

function updateServiceRecord(s) {
  const sheet = getSheetGeneric_(SHEET_SERVICE, HEADERS_SERVICE);
  const row = findRowById_(sheet, s.id);
  if (row === -1) throw new Error('ไม่พบข้อมูล');
  const d = s.date ? toDateOrBlank_(s.date) : new Date();
  sheet.getRange(row, 3, 1, 3).setValues([[s.type || '', s.detail || '', d]]);
  return true;
}

function deleteServiceRecord(id) {
  const sheet = getSheetGeneric_(SHEET_SERVICE, HEADERS_SERVICE);
  const row = findRowById_(sheet, id);
  if (row === -1) throw new Error('ไม่พบข้อมูล');
  sheet.deleteRow(row);
  return true;
}

// ===================== Deals (ระบบติดตามลูกค้า) =====================
function getDealsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_DEALS);

  if (sheet) {
    const lastCol = Math.max(sheet.getLastColumn(), 1);
    const existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const matches = HEADERS_DEALS.length === existingHeaders.length &&
      HEADERS_DEALS.every(function (h, i) { return existingHeaders[i] === h; });

    if (!matches) {
      const matchesLegacyNoDetail = HEADERS_DEALS_LEGACY_NO_NEWDETAIL.length === existingHeaders.length &&
        HEADERS_DEALS_LEGACY_NO_NEWDETAIL.every(function (h, i) { return existingHeaders[i] === h; });

      if (matchesLegacyNoDetail) {
        // อัปเกรดจากโครงสร้างเดิม: แทรกคอลัมน์ "รายละเอียดดีลใหม่" ต่อจาก "วันที่ดีลใหม่" โดยไม่ลบข้อมูลเดิม
        sheet.insertColumnAfter(7);
        const headerCell = sheet.getRange(1, 8);
        headerCell.setValue('รายละเอียดดีลใหม่');
        headerCell.setFontWeight('bold').setBackground('#1B2E2B').setFontColor('#F6F3EC');
      } else {
        // โครงสร้างชีต Deals เดิมไม่ตรงกับระบบเวอร์ชันใหม่ (มาจากเวอร์ชันก่อนหน้า)
        // สำรองข้อมูลเดิมไว้โดยเปลี่ยนชื่อชีต แทนที่จะลบทิ้ง แล้วค่อยสร้างชีตใหม่
        let backupName = 'Deals_เวอร์ชันเก่า_สำรอง';
        let n = 1;
        while (ss.getSheetByName(backupName)) {
          n++;
          backupName = 'Deals_เวอร์ชันเก่า_สำรอง_' + n;
        }
        sheet.setName(backupName);
        sheet = null;
      }
    }
  }

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_DEALS);
    sheet.appendRow(HEADERS_DEALS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS_DEALS.length).setFontWeight('bold').setBackground('#1B2E2B').setFontColor('#F6F3EC');
    sheet.autoResizeColumns(1, HEADERS_DEALS.length);
  }

  return sheet;
}

function dealRowToObject_(r) {
  return {
    id: r[0], customerId: r[1], customerName: r[2], product: r[3], stage: r[4], value: r[5],
    newDate: dateVal_(r[6]), newDetail: r[7],
    contactedDate: dateVal_(r[8]), contactedDetail: r[9],
    quotedDate: dateVal_(r[10]), quotedDetail: r[11],
    negotiatingDate: dateVal_(r[12]), negotiatingDetail: r[13],
    closedDate: dateVal_(r[14]), closedDetail: r[15],
    nextFollowUpDate: dateVal_(r[16]), nextFollowUpNote: r[17],
    createdAt: dateVal_(r[18]), updatedAt: dateVal_(r[19])
  };
}

function getDeals() {
  const sheet = getDealsSheet_();
  return sheetToObjects_(sheet, HEADERS_DEALS, dealRowToObject_);
}

function addDeal(deal) {
  const sheet = getDealsSheet_();
  const id = Utilities.getUuid();
  const now = new Date();
  const newDate = deal.dealDate ? toDateOrBlank_(deal.dealDate) : now;
  sheet.appendRow([
    id, deal.customerId || '', deal.customerName || '', deal.product || '', DEAL_STAGES[0], deal.value || 0,
    newDate, deal.newDetail || '',
    '', '',
    '', '',
    '', '',
    '', '',
    toDateOrBlank_(deal.nextFollowUpDate), deal.nextFollowUpNote || '',
    now, now
  ]);
  return id;
}

/**
 * แก้ไขข้อมูลทั่วไปของดีล (ไม่รวมการเปลี่ยนสถานะ ซึ่งต้องระบุวันที่/รายละเอียดผ่าน updateDealStage)
 */
function updateDeal(deal) {
  const sheet = getDealsSheet_();
  const row = findRowById_(sheet, deal.id);
  if (row === -1) throw new Error('ไม่พบดีลนี้');
  sheet.getRange(row, 2, 1, 3).setValues([[deal.customerId || '', deal.customerName || '', deal.product || '']]);
  sheet.getRange(row, 6).setValue(deal.value || 0);
  sheet.getRange(row, 8).setValue(deal.newDetail || '');
  sheet.getRange(row, 17).setValue(toDateOrBlank_(deal.nextFollowUpDate));
  sheet.getRange(row, 18).setValue(deal.nextFollowUpNote || '');
  sheet.getRange(row, 20).setValue(new Date());
  return true;
}

/**
 * เปลี่ยนสถานะดีล พร้อมบันทึกวันที่และรายละเอียดของสถานะนั้นๆ
 */
function updateDealStage(id, stage, stageDate, stageDetail) {
  const sheet = getDealsSheet_();
  const row = findRowById_(sheet, id);
  if (row === -1) throw new Error('ไม่พบดีลนี้');
  const idx = DEAL_STAGES.indexOf(stage);
  if (idx === -1) throw new Error('สถานะไม่ถูกต้อง');

  const d = stageDate ? toDateOrBlank_(stageDate) : new Date();

  if (idx === 0) {
    sheet.getRange(row, 7).setValue(d);
    sheet.getRange(row, 8).setValue(stageDetail || '');
  } else {
    const dateCol = 9 + (idx - 1) * 2;
    sheet.getRange(row, dateCol).setValue(d);
    sheet.getRange(row, dateCol + 1).setValue(stageDetail || '');
  }
  sheet.getRange(row, 5).setValue(stage);
  sheet.getRange(row, 20).setValue(new Date());
  return true;
}

function deleteDeal(id) {
  const sheet = getDealsSheet_();
  const row = findRowById_(sheet, id);
  if (row === -1) throw new Error('ไม่พบดีลนี้');
  sheet.deleteRow(row);
  return true;
}

// ===================== นัดหมาย (ไม่ผูกกับดีล) =====================
function getAppointmentsSheet_() {
  return getSheetGeneric_(SHEET_APPOINTMENTS, HEADERS_APPOINTMENTS);
}

function appointmentRowToObject_(r) {
  return {
    id: r[0], customerId: r[1], customerName: r[2],
    date: dateVal_(r[3]), note: r[4],
    createdAt: dateVal_(r[5]), updatedAt: dateVal_(r[6])
  };
}

function getAppointments() {
  const sheet = getAppointmentsSheet_();
  return sheetToObjects_(sheet, HEADERS_APPOINTMENTS, appointmentRowToObject_);
}

function addAppointment(a) {
  const sheet = getAppointmentsSheet_();
  const id = Utilities.getUuid();
  const now = new Date();
  sheet.appendRow([
    id, a.customerId || '', a.customerName || '',
    toDateOrBlank_(a.date), a.note || '', now, now
  ]);
  return id;
}

function updateAppointment(a) {
  const sheet = getAppointmentsSheet_();
  const row = findRowById_(sheet, a.id);
  if (row === -1) throw new Error('ไม่พบนัดหมายนี้');
  sheet.getRange(row, 2, 1, 4).setValues([[
    a.customerId || '', a.customerName || '', toDateOrBlank_(a.date), a.note || ''
  ]]);
  sheet.getRange(row, 7).setValue(new Date());
  return true;
}

function deleteAppointment(id) {
  const sheet = getAppointmentsSheet_();
  const row = findRowById_(sheet, id);
  if (row === -1) throw new Error('ไม่พบนัดหมายนี้');
  sheet.deleteRow(row);
  return true;
}

// ===================== Settings (เป้าหมายยอดขาย) =====================
function findSettingRow_(sheet, key) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const keys = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < keys.length; i++) {
    if (keys[i][0] === key) return i + 2;
  }
  return -1;
}

function getSalesTarget() {
  const sheet = getSheetGeneric_(SHEET_SETTINGS, HEADERS_SETTINGS);
  const row = findSettingRow_(sheet, 'salesTargetMonthly');
  return row === -1 ? 0 : (Number(sheet.getRange(row, 2).getValue()) || 0);
}

function setSalesTarget(value) {
  const sheet = getSheetGeneric_(SHEET_SETTINGS, HEADERS_SETTINGS);
  const row = findSettingRow_(sheet, 'salesTargetMonthly');
  if (row === -1) {
    sheet.appendRow(['salesTargetMonthly', value]);
  } else {
    sheet.getRange(row, 2).setValue(value);
  }
  return true;
}

// ===================== หน้าแรกของตัวแทน =====================
function getHomeSummary() {
  const deals = getDeals();
  const appointments = getAppointments();
  const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  const now = new Date();
  const limitDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const limitStr = Utilities.formatDate(limitDate, tz, 'yyyy-MM-dd');

  // นัดหมายที่ต้องแสดง: เลยกำหนด, วันนี้, และล่วงหน้าไม่เกิน 7 วัน
  const dealFollowUps = deals
    .filter(function (d) {
      if (!d.nextFollowUpDate || d.stage === 'ปิดการขาย') return false;
      return String(d.nextFollowUpDate).slice(0, 10) <= limitStr;
    })
    .map(function (d) {
      return { type: 'deal', id: d.id, customerName: d.customerName, product: d.product, date: d.nextFollowUpDate, note: d.nextFollowUpNote };
    });

  const apptFollowUps = appointments
    .filter(function (a) {
      if (!a.date) return false;
      return String(a.date).slice(0, 10) <= limitStr;
    })
    .map(function (a) {
      return { type: 'appointment', id: a.id, customerId: a.customerId, customerName: a.customerName || '(ไม่ระบุลูกค้า)', product: '', date: a.date, note: a.note };
    });

  const followUps = dealFollowUps.concat(apptFollowUps)
    .sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });

  // แจ้งเตือนถึงกำหนดชำระเบี้ย: ทุกประเภท (ชีวิต/รถยนต์/อัคคีภัย) ภายใน 30 วัน
  const premiumDues = getPremiumDueAlerts(30);

  // เป้าหมายยอดขาย: เทียบมูลค่าดีลที่ปิดการขายในเดือนนี้กับเป้าที่ตั้งไว้
  const target = getSalesTarget();
  const closedThisMonth = deals.filter(function (d) {
    if (d.stage !== 'ปิดการขาย' || !d.closedDate) return false;
    const cd = new Date(d.closedDate);
    return cd.getFullYear() === now.getFullYear() && cd.getMonth() === now.getMonth();
  });
  const achieved = closedThisMonth.reduce(function (s, d) { return s + (Number(d.value) || 0); }, 0);

  return {
    followUps: followUps,
    premiumDues: premiumDues,
    salesTarget: {
      target: target,
      achieved: achieved,
      percent: target ? Math.round((achieved / target) * 100) : 0,
      dealCount: closedThisMonth.length
    }
  };
}

/**
 * แจ้งเตือนถึงกำหนดชำระเบี้ย (ทุกประเภทกรมธรรม์) ภายใน N วัน
 * - ชีวิต/สุขภาพ : ใช้ "วันที่ครบกำหนดชำระเบี้ย" และแสดง "เลขที่กรมธรรม์"
 * - รถยนต์       : ใช้ "วันที่สิ้นสุดความคุ้มครอง" แสดงทะเบียนรถ (แทนเลขที่กรมธรรม์) + ประเภทประกันรถยนต์
 * - อัคคีภัย      : ใช้ "วันที่สิ้นสุดความคุ้มครอง" แสดงสถานที่เอาประกัน + ประเภท
 */
function getPremiumDueAlerts(daysAhead) {
  const now = new Date();
  const limit = new Date(now.getTime() + (daysAhead || 30) * 24 * 60 * 60 * 1000);
  const alerts = [];

  const customerMap = {};
  getCustomers().forEach(function (c) { customerMap[c.id] = c; });

  function push_(list, category, label, dateField, mapFn) {
    list.forEach(function (p) {
      const dateStr = p[dateField];
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (isNaN(d.getTime()) || d > limit) return;
      const cust = customerMap[p.customerId];
      const extra = mapFn(p);
      alerts.push({
        customerId: p.customerId,
        customerName: cust ? cust.fullName : '(ไม่พบชื่อลูกค้า)',
        category: category,
        label: label,
        policyNo: extra.policyNo || '',
        policyNoLabel: extra.policyNoLabel || 'เลขที่กรมธรรม์',
        policyType: extra.policyType || '',
        company: p.company || '',
        premium: Number(p.premium) || 0,
        dueDate: dateStr,
        overdue: d < now
      });
    });
  }

  push_(getPolicies('life', null), 'life', 'ประกันชีวิต/สุขภาพ', 'dueDate', function (p) {
    return { policyNo: p.policyNo, policyType: p.type };
  });
  push_(getPolicies('car', null), 'car', 'ประกันรถยนต์', 'endDate', function (p) {
    return { policyNo: p.plate, policyNoLabel: 'ทะเบียนรถ', policyType: p.type };
  });
  push_(getPolicies('fire', null), 'fire', 'ประกันอัคคีภัยบ้าน', 'endDate', function (p) {
    return { policyNo: p.location, policyNoLabel: 'สถานที่เอาประกัน', policyType: p.type };
  });

  alerts.sort(function (a, b) { return String(a.dueDate).localeCompare(String(b.dueDate)); });
  return alerts;
}

// ===================== Export รายงาน Excel =====================
function exportDashboardReport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tz = ss.getSpreadsheetTimeZone();
  const now = new Date();
  const summary = getHomeSummary();

  const reportSheetName = 'รายงาน (ชั่วคราว)';
  let sheet = ss.getSheetByName(reportSheetName);
  if (sheet) ss.deleteSheet(sheet);
  sheet = ss.insertSheet(reportSheetName, 0);

  let r = 1;
  sheet.getRange(r, 1).setValue('รายงานสรุป CRM ตัวแทนประกัน').setFontWeight('bold').setFontSize(16);
  r++;
  sheet.getRange(r, 1).setValue('สร้างเมื่อ ' + Utilities.formatDate(now, tz, 'dd/MM/yyyy HH:mm'));
  r += 2;

  sheet.getRange(r, 1, 1, 2).setValues([['เป้าหมายยอดขาย', 'ค่า']]).setFontWeight('bold');
  r++;
  sheet.getRange(r, 1, 3, 2).setValues([
    ['เป้าหมายเดือนนี้ (บาท)', summary.salesTarget.target],
    ['ยอดขายที่ทำได้เดือนนี้ (บาท)', summary.salesTarget.achieved],
    ['เปอร์เซ็นต์ที่ทำได้ (%)', summary.salesTarget.percent]
  ]);
  r += 5;

  sheet.getRange(r, 1, 1, 4).setValues([['วันนี้ต้องติดตาม', 'ลูกค้า', 'ผลิตภัณฑ์', 'วันนัดหมาย']]).setFontWeight('bold');
  r++;
  if (summary.followUps.length) {
    const rows = summary.followUps.map(function (d) { return ['', d.customerName, d.product, String(d.date).slice(0, 10)]; });
    sheet.getRange(r, 1, rows.length, 4).setValues(rows);
    r += rows.length;
  }
  r += 2;

  sheet.getRange(r, 1, 1, 6).setValues([['แจ้งเตือนถึงกำหนดชำระเบี้ย', 'ลูกค้า', 'เลขที่กรมธรรม์/ทะเบียนรถ', 'ประเภท', 'บริษัทประกัน', 'ครบกำหนด']]).setFontWeight('bold');
  r++;
  if (summary.premiumDues && summary.premiumDues.length) {
    const prows = summary.premiumDues.map(function (a) {
      return [a.label, a.customerName, a.policyNo, a.policyType, a.company, String(a.dueDate).slice(0, 10)];
    });
    sheet.getRange(r, 1, prows.length, 6).setValues(prows);
    r += prows.length;
  }

  sheet.autoResizeColumns(1, 6);
  SpreadsheetApp.flush();

  const url = 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?format=xlsx';
  const token = ScriptApp.getOAuthToken();
  const response = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true });

  ss.deleteSheet(sheet);

  if (response.getResponseCode() !== 200) {
    throw new Error('สร้างไฟล์ Excel ไม่สำเร็จ (HTTP ' + response.getResponseCode() + ')');
  }

  const blob = response.getBlob();
  const dateStr = Utilities.formatDate(now, tz, 'yyyyMMdd_HHmm');

  return {
    filename: 'CRM_Report_' + dateStr + '.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    base64: Utilities.base64Encode(blob.getBytes())
  };
}
