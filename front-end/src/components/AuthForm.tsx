export default function AuthForm() {
  return (
    <form className="space-y-4">
      {/* Add form fields here */}
      <input type="text" placeholder="Username" className="border p-2 w-full" />
      <input type="password" placeholder="Password" className="border p-2 w-full" />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Submit</button>
    </form>
  );
}
