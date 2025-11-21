from codecarbon import OfflineEmissionsTracker
import time
import os
import warnings
warnings.filterwarnings("ignore", module="codecarbon")
os.makedirs("logs", exist_ok=True)
tracker = OfflineEmissionsTracker(
    project_name="chatservice-conversation",
    country_iso_code="USA",
    output_dir="logs",
    tracking_mode="process",
    gpu_ids=None,  # disables GPU lookup
    log_level="error"  # hide warnings
)

# tracker.start()

# # Simulate a small workload
# for _ in range(5_000_000):
#     _ = 123 * 456
# time.sleep(1)

# emissions_kg = tracker.stop()
# energy_kwh = tracker.final_emissions_data.energy_consumed

# print(f"Energy consumed: {energy_kwh} kWh")
# print(f"Carbon emissions: {emissions_kg:.9f} kg CO₂eq")