const TabHeader = ({ breadcrumb, anotherBreadcrumb }) => {
  return (
    <>
      <div className="all-products-header">
        <div>
          <div className="all-products-title">{breadcrumb}</div>
          <div className="all-products-breadcrumb">
            Home &gt; {breadcrumb}{" "}
            {anotherBreadcrumb ? `> ${anotherBreadcrumb}` : ""}
          </div>
        </div>
      </div>
    </>
  );
};

export default TabHeader;
