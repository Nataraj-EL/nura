package com.nura.service;

import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class CareGuidanceService {

    private static final String DISCLAIMER = "Nura is an educational tracking companion, not a clinical diagnostic tool. The contents here are for educational purposes only and should not replace professional medical advice, diagnosis, or treatment.";
    private static final String VERSION = "1.0";
    private static final String LAST_REVIEWED = "2026-08-23";

    public static record CareItem(String title, String description, String category) {}

    public static record CareResponse(
        String contentVersion, 
        String lastReviewed, 
        String medicalDisclaimer, 
        String category, 
        List<CareItem> items
    ) {}

    public CareResponse getGuidance() {
        List<CareItem> items = new ArrayList<>();
        items.add(new CareItem(
            "Understanding Cycle Length Variation",
            "Menstrual cycle lengths naturally vary between people and across cycles. While standard guides reference typical ranges of 21 to 35 days, individual variation is common. Tracking cycle dates helps build a personal baseline rather than mapping to a single statistical standard.",
            "GENERAL_INFORMATION"
        ));
        items.add(new CareItem(
            "Period Bleeding Durations",
            "Bleeding duration commonly ranges between 3 to 8 days, though individual variations occur. Sudden changes in typical length or pattern are helpful logs to discuss with a doctor.",
            "GENERAL_INFORMATION"
        ));
        return new CareResponse(VERSION, LAST_REVIEWED, DISCLAIMER, "GENERAL_INFORMATION", items);
    }

    public CareResponse getSymptoms() {
        List<CareItem> items = new ArrayList<>();
        items.add(new CareItem(
            "Somatic Cramping Observations",
            "Somatic cramping in the lower abdomen is frequently reported by users tracking the start of a period. Observations indicate temporary muscle contractions occur as the uterine lining sheds.",
            "GENERAL_INFORMATION"
        ));
        items.add(new CareItem(
            "Low-Risk Cramps Support",
            "Applying gentle warmth (like a warm compress or bath) to the lower abdomen or using simple relaxation exercises are general low-risk self-care suggestions.",
            "SELF_CARE"
        ));
        items.add(new CareItem(
            "Uterine Bloating Observations",
            "Temporary fullness or bloating in the abdomen is commonly noted by tracking users. This observation is often logged alongside shifts in hydration levels.",
            "GENERAL_INFORMATION"
        ));
        items.add(new CareItem(
            "Low-Risk Hydration Balance",
            "Drinking water consistently and consuming balanced meals with reduced sodium can assist in managing general fluid balance issues.",
            "SELF_CARE"
        ));
        return new CareResponse(VERSION, LAST_REVIEWED, DISCLAIMER, "SELF_CARE", items);
    }

    public CareResponse getSafety() {
        List<CareItem> items = new ArrayList<>();
        
        // CONTACT_HEALTHCARE_PROFESSIONAL indicators
        items.add(new CareItem(
            "Persistent Cycle Irregularity",
            "Consider contacting a healthcare provider if your cycles are consistently shorter than 21 days or longer than 45 days, or if you miss periods for more than three consecutive cycles.",
            "CONTACT_HEALTHCARE_PROFESSIONAL"
        ));
        items.add(new CareItem(
            "Prolonged Bleeding Duration",
            "If your period bleeding regularly exceeds 10 consecutive days, it is recommended to discuss this pattern with a clinical professional.",
            "CONTACT_HEALTHCARE_PROFESSIONAL"
        ));

        // URGENT_MEDICAL_ATTENTION red flags
        items.add(new CareItem(
            "Sudden Severe Pelvic Pain",
            "Seek urgent medical attention if you experience sudden, unusually severe, or localized pelvic pain that does not ease.",
            "URGENT_MEDICAL_ATTENTION"
        ));
        items.add(new CareItem(
            "High Fever with Device Use",
            "Seek urgent medical attention if a high fever, vomiting, diarrhea, or a sunburn-like rash develops while using tampons, cups, or other menstrual products.",
            "URGENT_MEDICAL_ATTENTION"
        ));
        items.add(new CareItem(
            "Unusually Heavy Bleeding",
            "Seek urgent medical attention if bleeding is unusually heavy, such as soaking through one or more pads or tampons every hour for consecutive hours.",
            "URGENT_MEDICAL_ATTENTION"
        ));

        return new CareResponse(VERSION, LAST_REVIEWED, DISCLAIMER, "URGENT_MEDICAL_ATTENTION", items);
    }
}
