import { firebaseApp, db } from '../../src/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

type Data = {
    message: string;
    item?: any;
    networkError?: boolean;

};

// Helper function to diagnose network errors
function diagnoseNetworkError(error: any): boolean {
    if (error && error.code) {
        return error.code === "unavailable" || error.code === "deadline-exceeded";
    }
    return false;
}
type Request = { method: string; body: any };
type Response = {
    status: (statusCode: number) => { json: (data: Data) => void };
};

export default async function handler(req: Request, res: Response):Promise<void> {
    if (req.method === 'POST') {
        try {
            const newItem = req.body;
            const itemsCollection = collection(db, 'items'); // Correct collection call
            const docRef = await addDoc(itemsCollection, newItem);
            const createdItem = { id: docRef.id, ...newItem };
            res.status(201).json({ message: 'Item created successfully', item: createdItem });
        } catch (error) {
            console.error('Error creating item:', error);
            const isNetworkError: boolean = diagnoseNetworkError(error);
            res.status(400).json({ message: 'Error creating item', networkError: isNetworkError });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}
