document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
       // Reset select options (keep placeholder)
       activitySelect.innerHTML = `<option value="">-- Select an activity --</option>`;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - (details.participants || []).length;

        // Build participants HTML
        const participants = details.participants || [];
        let participantsHtml = `<p><strong>Participants:</strong></p>`;
        if (participants.length === 0) {
          participantsHtml += `<p class="no-participants">No participants yet</p>`;
        } else {
          participantsHtml += `<ul class="participants-list">`;
          participants.forEach((p) => {
            // include a remove button for each participant
            participantsHtml += `
              <li class="participant-item">
                <span class="participant-name">${p}</span>
                <button class="remove-participant" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(p)}" aria-label="Remove participant">✖</button>
              </li>
            `;
          });
          participantsHtml += `</ul>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Delegate click events for remove buttons inside this activity card
        activityCard.addEventListener("click", async (evt) => {
          const btn = evt.target.closest && evt.target.closest('.remove-participant');
          if (!btn) return;

          const activityEncoded = btn.getAttribute('data-activity');
          const emailEncoded = btn.getAttribute('data-email');
          const activityName = decodeURIComponent(activityEncoded);
          const email = decodeURIComponent(emailEncoded);

          if (!confirm(`Remove ${email} from ${activityName}?`)) return;

          try {
            const res = await fetch(`/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`, {
              method: 'DELETE',
            });
            const data = await res.json();
            if (res.ok) {
              messageDiv.textContent = data.message;
              messageDiv.className = 'success';
              messageDiv.classList.remove('hidden');
              // refresh activities to reflect change
              fetchActivities();
            } else {
              messageDiv.textContent = data.detail || 'Failed to remove participant';
              messageDiv.className = 'error';
              messageDiv.classList.remove('hidden');
            }
            setTimeout(() => messageDiv.classList.add('hidden'), 5000);
          } catch (err) {
            console.error('Error removing participant:', err);
            messageDiv.textContent = 'Failed to remove participant';
            messageDiv.className = 'error';
            messageDiv.classList.remove('hidden');
          }
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the new participant appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
