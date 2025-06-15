document.addEventListener('DOMContentLoaded', () => {
  // Close alert messages after 5 seconds
  const alerts = document.querySelectorAll('.alert');
  if (alerts.length > 0) {
    setTimeout(() => {
      alerts.forEach(alert => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 300);
      });
    }, 5000);
  }

  // Add confirmation for delete actions
  const deleteForms = document.querySelectorAll('form[action*="/delete"], form[action*="/tasks/"][method="POST"] input[name="_method"][value="DELETE"]');
  deleteForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      if (!confirm('Are you sure you want to delete this task?')) {
        e.preventDefault();
      }
    });
  });
});