import './CartPage.css'
import { PromoteBanner } from '../components/PromoBanner';
import { CartSection } from '../components/CartSection';
import { RecommendSection } from '../components/RecommendSection';

export const CartPage = () => {
    return(
        <div className='cart-container'>
        <PromoteBanner/>
        <CartSection/>
        <RecommendSection/>
        </div>
    )
}

export default CartPage;