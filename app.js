// โหลด Google Charts API
google.charts.load('current', {'packages':['gantt']});

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzsq6AyubtZhyxdWfHL4Ee2JsHr_4tH3vlYL4HjWtFGEcpa122zOm9W-iaVSvZ4ytnG/exec";

document.addEventListener("DOMContentLoaded", () => {
    
    // ตั้งค่า Date Picker ให้เป็นวันที่ปัจจุบันในช่องบันทึกประวัติ
    document.getElementById('recordDate').valueAsDate = new Date();

    // Logic จัดการ Checkbox
    const unknownStartCb = document.getElementById('unknownStart');
    const startDateInput = document.getElementById('startDate');
    const currentlyUsingCb = document.getElementById('currentlyUsing');
    const endDateInput = document.getElementById('endDate');

    unknownStartCb.addEventListener('change', (e) => {
        startDateInput.disabled = e.target.checked;
        if(e.target.checked) startDateInput.value = '';
    });

    currentlyUsingCb.addEventListener('change', (e) => {
        endDateInput.disabled = e.target.checked;
        if(e.target.checked) endDateInput.value = '';
    });

    // Toggle แสดง Timeline
    const toggleTimeline = document.getElementById('toggleTimeline');
    const timelineContainer = document.getElementById('timelineContainer');
    toggleTimeline.addEventListener('change', (e) => {
        timelineContainer.style.display = e.target.checked ? 'block' : 'none';
        if(e.target.checked) drawChart();
    });

    // ปุ่มจำลองการอัปโหลด JSON
    const btnOpenFile = document.getElementById('btnOpenFile');
    const fileInput = document.getElementById('fileInput');

    btnOpenFile.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                // ดึงข้อมูลมายัดใส่ Form
                document.getElementById('patientName').value = data.patientName || '';
                document.getElementById('hn').value = data.hn || '';
                document.getElementById('an').value = data.an || '';
                document.getElementById('pharmacist').value = data.pharmacist || '';
                document.getElementById('drugName').value = data.drugName || '';
                document.getElementById('dose').value = data.dose || '';
                document.getElementById('adrSymptom').value = data.adrSymptom || '';
                document.getElementById('pharmacistNote').value = data.pharmacistNote || '';
                
                if(data.startDate) startDateInput.value = data.startDate;
                if(data.endDate) endDateInput.value = data.endDate;
                if(data.adrDate) document.getElementById('adrDate').value = data.adrDate;

                alert('โหลดข้อมูลจากไฟล์สำเร็จ');
                drawChart();
            } catch (err) {
                alert('ไฟล์ JSON ไม่ถูกต้อง');
            }
        };
        reader.readAsText(file);
    });

    // พรีวิว Chart
    document.getElementById('btnPlot').addEventListener('click', drawChart);

    // ส่งข้อมูลแบบฟอร์ม
    document.getElementById('adrForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const submitBtn = document.getElementById('btnSubmit');
        submitBtn.disabled = true;
        submitBtn.innerText = "กำลังบันทึก...";

        const payload = {
            patientName: document.getElementById('patientName').value,
            hn: document.getElementById('hn').value,
            an: document.getElementById('an').value,
            recordDate: document.getElementById('recordDate').value,
            pharmacist: document.getElementById('pharmacist').value,
            drugName: document.getElementById('drugName').value,
            dose: document.getElementById('dose').value,
            startDate: startDateInput.value,
            firstDoseTime: document.getElementById('firstDoseTime').value,
            endDate: endDateInput.value,
            lastDoseTime: document.getElementById('lastDoseTime').value,
            unknownStart: unknownStartCb.checked,
            currentlyUsing: currentlyUsingCb.checked,
            adrSymptom: document.getElementById('adrSymptom').value,
            adrDate: document.getElementById('adrDate').value,
            pharmacistNote: document.getElementById('pharmacistNote').value
        };

        fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            alert('บันทึกข้อมูลเรียบร้อยแล้ว');
            submitBtn.disabled = false;
            submitBtn.innerText = "บันทึกข้อมูลเข้าสู่ระบบ";
            // รีเซ็ตฟอร์ม หรือทำอย่างอื่นตามต้องการ
        })
        .catch(error => {
            alert('เกิดข้อผิดพลาด: ' + error);
            submitBtn.disabled = false;
            submitBtn.innerText = "บันทึกข้อมูลเข้าสู่ระบบ";
        });
    });
});

// ฟังก์ชันวาด Gantt Chart
function drawChart() {
    if (!document.getElementById('toggleTimeline').checked) return;

    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Task ID');
    data.addColumn('string', 'Task Name');
    data.addColumn('string', 'Resource');
    data.addColumn('date', 'Start Date');
    data.addColumn('date', 'End Date');
    data.addColumn('number', 'Duration');
    data.addColumn('number', 'Percent Complete');
    data.addColumn('string', 'Dependencies');

    const drugName = document.getElementById('drugName').value || 'ยาที่ประเมิน';
    let startDate = document.getElementById('startDate').value;
    let endDate = document.getElementById('endDate').value;
    let adrDate = document.getElementById('adrDate').value;
    const adrSymptom = document.getElementById('adrSymptom').value || 'เริ่มมีอาการ ADR';

    // จัดการกรณีไม่ระบุวันที่
    const today = new Date();
    let startD = startDate ? new Date(startDate) : new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000)); // ถอยไป 7 วันถ้าไม่ทราบ
    let endD = endDate ? new Date(endDate) : today; 
    if(document.getElementById('currentlyUsing').checked) endD = today;

    let rows = [];

    // เพิ่มแท่งการใช้ยา
    rows.push([
        'Drug', 
        drugName, 
        'Medication', 
        startD, 
        endD, 
        null, 100, null
    ]);

    // เพิ่มจุด (แท่งสั้นๆ) ของวันที่เกิด ADR
    if (adrDate) {
        let adrD = new Date(adrDate);
        // ทำให้ Duration สั้นที่สุดเพื่อจำลองเป็น Milestone (จุด)
        let adrEnd = new Date(adrD.getTime() + (1 * 24 * 60 * 60 * 1000)); 
        rows.push([
            'ADR', 
            adrSymptom, 
            'ADR Event', 
            adrD, 
            adrEnd, 
            null, 100, null
        ]);
    }

    data.addRows(rows);

    var options = {
      height: 250,
      gantt: {
        trackHeight: 40,
        palette: [
            {"color": "#0d6efd", "dark": "#0b5ed7", "light": "#6ea8fe"}, // สีฟ้าสำหรับยา
            {"color": "#dc3545", "dark": "#b02a37", "light": "#ea868f"}  // สีแดงสำหรับ ADR
        ]
      }
    };

    var chart = new google.visualization.Gantt(document.getElementById('chart_div'));
    chart.draw(data, options);
}
