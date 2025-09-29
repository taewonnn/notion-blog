export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-red-500 mb-4">Blog List</h1>
      <div className="space-y-4">
        <div className="bg-blue-100 p-4 rounded-lg">
          <p className="text-blue-800">Tailwind CSS v4 테스트 - 이 박스가 파란색이면 성공!</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <p className="text-green-800">기본 Tailwind 클래스들이 작동하는지 확인</p>
        </div>
      </div>
    </div>
  );
}
