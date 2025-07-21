const DeleteUserData = () => {
  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <h1>Request to Delete Your Data</h1>
      <p>
        If you wish to delete your account and associated personal data from our system, please
        follow the instructions below.
      </p>

      <h2>Steps to Request Deletion</h2>
      <ol>
        <li>
          Send an email to <strong>kickslabss@gmail.com</strong>
        </li>
        <li>
          Include your account email address and subject: <strong>Delete My Account</strong>
        </li>
        <li>We will process your request within 7 days</li>
      </ol>

      <p>
        Alternatively, if your account was created using Facebook/Google login, revoking access via
        Facebook/Google settings will also restrict future access.
      </p>

      <h2>Need Help?</h2>
      <p>
        For support or urgent issues, contact us at <strong>kickslabss@gmail.com</strong>
      </p>
    </div>
  );
};

export default DeleteUserData;
