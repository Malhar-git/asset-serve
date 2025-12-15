/* eslint-disable react/no-unescaped-entities */
export default function PortfolioTables() {
  return (


    <div className="relative overflow-x-auto bg-neutral-primary-soft shadow-xs rounded-base border border-default">
      <table className="w-full text-sm text-left rtl:text-right text-body border-collapse">
        <thead className="text-sm text-body bg-neutral-secondary-soft border-b border-default rounded-base">
          <tr>
            <th scope="col" className="px-6 py-3 font-medium border-0">
              Name
            </th>
            <th scope="col" className="px-6 py-3 font-medium border-0">
              Symbol Token
            </th>

            <th scope="col" className="px-6 py-3 font-medium border-0">
              LTP
            </th>
            <th scope="col" className="px-6 py-3 font-medium border-0">
              Avg
            </th>
            <th scope="col" className="px-6 py-3 font-medium border-0">
              Qty
            </th>
            <th scope="col" className="px-6 py-3 font-medium border-0">
              Value
            </th>
            <th scope="col" className="px-6 py-3 font-medium border-0">
              P&L
            </th>
            <th scope="col" className="px-6 py-3 font-medium border-0">
              P&L percentage
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-white border-b border-none">
            <th scope="row" className="px-6 py-4 font-medium text-heading whitespace-nowrap border-0">
              "Apple MacBook Pro "
            </th>
            <td className="px-6 py-4 border-0">
              Silver
            </td>
            <td className="px-6 py-4 border-0">
              Laptop
            </td>
            <td className="px-6 py-4 border-0">
              $2999
            </td>
            <td className="px-6 py-4 border-0">
              231
            </td>
          </tr>
          <tr className="bg-neutral-100 border-none">
            <th scope="row" className="px-6 py-4 font-medium text-heading whitespace-nowrap border-0">
              Microsoft Surface Pro
            </th>
            <td className="px-6 py-4 border-0">
              White
            </td>
            <td className="px-6 py-4 border-0">
              Laptop PC
            </td>
            <td className="px-6 py-4 border-0">
              $1999
            </td>
            <td className="px-6 py-4 border-0">
              423
            </td>
          </tr>
          <tr className="bg-white border-none">
            <th scope="row" className="px-6 py-4 font-medium text-heading whitespace-nowrap border-none">
              Magic Mouse 2
            </th>
            <td className="px-6 py-4 border-0">
              Black
            </td>
            <td className="px-6 py-4 border-0">
              Accessories
            </td>
            <td className="px-6 py-4 border-0">
              $99
            </td>
            <td className="px-6 py-4 border-0">
              121
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  )
}